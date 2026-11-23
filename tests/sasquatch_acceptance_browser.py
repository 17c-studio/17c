"""Run against isolated Chrome CDP on 9223. All acceptance requests are mocked and blocked.
The signing gates are enabled only in test-page memory; repository flags are not changed.
Requires websocket-client and pypdf. Outputs QA artifacts under /tmp/sasquatch-form-qa-output.
"""
import base64
import json
import time
import urllib.request
from pathlib import Path
import websocket
from pypdf import PdfReader

root = Path(__file__).resolve().parents[1]
out = Path('/tmp/sasquatch-form-qa-output'); out.mkdir(exist_ok=True)
target = next(t for t in json.load(urllib.request.urlopen('http://127.0.0.1:9223/json')) if t['type'] == 'page')
ws = websocket.create_connection(target['webSocketDebuggerUrl'], suppress_origin=True)
seq = 0

def cdp(method, params=None):
    global seq
    seq += 1
    ws.send(json.dumps({'id': seq, 'method': method, 'params': params or {}}))
    while True:
        result = json.loads(ws.recv())
        if result.get('id') == seq:
            assert 'error' not in result, result
            return result.get('result', {})

def js(expression):
    result = cdp('Runtime.evaluate', {'expression': expression, 'returnByValue': True, 'awaitPromise': True})
    assert 'exceptionDetails' not in result, result
    return result['result'].get('value')

def pause(ms=150):
    js('new Promise(resolve=>setTimeout(resolve,%d))' % ms)

cdp('Page.enable'); cdp('Runtime.enable'); cdp('Network.enable')
cdp('Network.setBlockedURLs', {'urls': ['*formspree.io*', '*collect*']})
mock = """
window.__requests=[];window.__mode='ok';window.__delay=0;
window.fetch=async(url,options)=>{
 window.__requests.push({url,fields:Object.fromEntries(options.body.entries())});
 if(window.__delay)await new Promise(r=>setTimeout(r,window.__delay));
 if(window.__mode==='network')throw new TypeError('TEST network failure');
 if(window.__mode==='abort')throw new DOMException('TEST timeout','AbortError');
 return {ok:window.__mode!=='http',json:async()=>{
  if(window.__mode==='malformed')throw new Error('TEST malformed JSON');
  return {ok:!['http','rejected'].includes(window.__mode)};
 }};
};
const originalCreateURL=URL.createObjectURL.bind(URL);
URL.createObjectURL=blob=>{window.__downloadBlob=blob;return originalCreateURL(blob)};
HTMLAnchorElement.prototype.click=function(){window.__downloadName=this.download};
"""
cdp('Page.addScriptToEvaluateOnNewDocument', {'source': mock})

def load(enable=True):
    cdp('Page.navigate', {'url': (root / 'proposal-sasquatch.html').as_uri()})
    for _ in range(30):
        pause(100)
        if js("!!document.getElementById('reply-status') && document.readyState==='complete'"): break
    assert js("document.readyState==='complete'")
    if enable:
        js("const f=document.getElementById('reply');f.dataset.termsApproved='true';f.dataset.endpointConfirmed='true';f.dispatchEvent(new Event('change',{bubbles:true}))")
        assert not js("document.getElementById('accept-submit').disabled")


def fill(package='package1'):
    js("""document.getElementById('package').value=%s;
 document.getElementById('package').dispatchEvent(new Event('change',{bubbles:true}));
 document.getElementById('signer-name').value='TEST ONLY — dummy signature';
 document.getElementById('signer-email').value='test@example.invalid';
 document.getElementById('accept-consent').checked=true;
 """ % json.dumps(package))


def submit():
    js("document.getElementById('reply').requestSubmit()")
    pause()

report = []
# Verify the actual production gates block transmission, including programmatic submission.
load(False)
production_ready = js("document.getElementById('reply').dataset.termsApproved==='true' && document.getElementById('reply').dataset.endpointConfirmed==='true'")
if not production_ready:
    assert js("document.getElementById('accept-submit').disabled")
    assert js("document.getElementById('accept-submit').hidden && document.getElementById('signer-name').hidden")
    fill(); submit()
    assert js("document.getElementById('reply-status').dataset.state") == 'error'
    assert js('window.__requests.length') == 0
report.append({'production_enabled': production_ready})
# Native required fields plus whitespace-only typed signature validation.
for missing in ['package', 'name', 'email', 'invalid_email', 'consent', 'spaces']:
    load(); fill()
    expressions = {
        'package': "document.getElementById('package').value=''",
        'name': "document.getElementById('signer-name').value=''",
        'email': "document.getElementById('signer-email').value=''",
        'invalid_email': "document.getElementById('signer-email').value='not-an-email'",
        'consent': "document.getElementById('accept-consent').checked=false",
        'spaces': "document.getElementById('signer-name').value='   '",
    }
    js(expressions[missing]); submit()
    assert js('window.__requests.length') == 0, missing
report.append({'validation': 'package, name, whitespace, email, email format, explicit acceptance passed'})
for package, amount, fee in [('package1', 1250, '$1,250/month'), ('package2', 1700, '$1,700/month')]:
    load(); fill(package)
    assert fee in js("document.getElementById('acceptance-summary').textContent")
    js('window.__delay=350'); submit()
    assert js("document.getElementById('reply').getAttribute('aria-busy')") == 'true'
    submit(); pause(450)
    assert js('window.__requests.length') == 1
    assert js("document.getElementById('reply-status').dataset.state") == 'success'
    assert js("!document.getElementById('acceptance-receipt').hidden")
    request = js('window.__requests[0]')
    fields = request['fields']; record = json.loads(fields['acceptance_record'])
    assert fields['monthly_fee'] == fee and record['selected']['monthly_fee_usd'] == amount
    assert fields['package_id'] == package and record['selected']['id'] == package
    assert record['selected']['monthly_fee'] == fee and record['signer_name'].startswith('TEST ONLY')
    assert '12 original' in fields['scope'] and 'each weekend' in fields['scope']
    assert ('20 new reviewers' in fields['scope']) == (package == 'package2')
    assert ('dashboard' in fields['scope']) == (package == 'package2')
    assert 'Payment' in record['terms'] and '25 days' in record['terms']
    assert 'later confirmation' in record['consent'] and 'written' in record['consent']
    js("document.getElementById('download-record').click()")
    download = js('window.__downloadBlob.text()')
    assert fee in download and record['record_id'] in download and record['terms'] in download
    submit(); assert js('window.__requests.length') == 1
    report.append({'package': package, 'monthly_fee': fee, 'record_download_and_duplicate_guard': 'passed'})
for mode in ['http', 'rejected', 'malformed', 'network', 'abort']:
    load(); fill(); js('window.__mode=%s' % json.dumps(mode)); submit()
    assert js("document.getElementById('reply-status').dataset.state") == 'error', mode
    assert not js("document.getElementById('accept-submit').disabled")
    assert js("document.getElementById('signer-name').value").startswith('TEST ONLY')
    first_id = js("window.__requests[0].fields.record_id")
    js("window.__mode='ok'"); submit()
    assert js("document.getElementById('reply-status').dataset.state") == 'success', mode
    assert first_id == js('window.__requests[1].fields.record_id')
report.append({'error_states': 'HTTP failure, rejected response, malformed JSON, network error, timeout; retry uses same record ID'})
load(); fill()
js("document.getElementById('package').value='package2';document.getElementById('package').dispatchEvent(new Event('change',{bubbles:true}))")
assert not js("document.getElementById('accept-consent').checked")
assert '$1,700/month' in js("document.getElementById('acceptance-summary').textContent")
report.append({'selection_change': 'summary updates and prior consent clears'})
for width, height in [(1440, 1000), (390, 844)]:
    cdp('Emulation.setDeviceMetricsOverride', {'width': width, 'height': height, 'deviceScaleFactor': 1, 'mobile': width < 500})
    pause(); assert js('document.documentElement.scrollWidth<=innerWidth')
    cdp('Page.bringToFront')
    js("document.documentElement.style.scrollBehavior='auto';document.getElementById('proposal-details').open=false;document.querySelector('#proposal-details summary').focus()")
    cdp('Input.dispatchKeyEvent', {'type': 'keyDown', 'key': 'Enter', 'code': 'Enter', 'windowsVirtualKeyCode': 13, 'text': '\r'})
    cdp('Input.dispatchKeyEvent', {'type': 'keyUp', 'key': 'Enter', 'code': 'Enter', 'windowsVirtualKeyCode': 13})
    assert js("document.getElementById('proposal-details').open")
    assert js("document.getElementById('signer-name').nextElementSibling.id") == 'proposal-details'
    js("document.getElementById('proposal-details').open=false;document.getElementById('reply').scrollIntoView({behavior:'instant'})")
    pause()
    (out / f'form-{width}.png').write_bytes(base64.b64decode(cdp('Page.captureScreenshot', {'format': 'png'})['data']))
assert js("document.querySelector('meta[name=robots]').content") == 'noindex, nofollow'
cdp('Emulation.setDeviceMetricsOverride', {'width': 1440, 'height': 1000, 'deviceScaleFactor': 1, 'mobile': False})
js("document.getElementById('proposal-details').open=false")
pdf = cdp('Page.printToPDF', {'printBackground': True, 'preferCSSPageSize': True, 'paperWidth': 8.5, 'paperHeight': 11})
(out / 'sasquatch-signing-qa.pdf').write_bytes(base64.b64decode(pdf['data']))
text = ' '.join(' '.join(page.extract_text().split()) for page in PdfReader(out / 'sasquatch-signing-qa.pdf').pages)
assert '$1,250/month' in text and '$1,700/month' in text and '25 days' in text and 'notice terms' in text
assert not js("document.getElementById('proposal-details').open")
report.append({'layout_and_print': 'desktop/mobile fit, keyboard details, details below typed signature, noindex, closed-accordion print includes terms'})
(out / 'verification.json').write_text(json.dumps(report, indent=2))
print(json.dumps(report, indent=2))
ws.close()
