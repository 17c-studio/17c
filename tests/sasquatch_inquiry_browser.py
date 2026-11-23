"""Browser checks for the non-binding discussion form. Requests are mocked and blocked.
Requires isolated Chrome CDP on 9223, websocket-client, and pypdf. No real messages are sent.
"""
import base64
import json
import time
import urllib.request
from pathlib import Path
import websocket
from pypdf import PdfReader

root = Path(__file__).resolve().parents[1]
out = Path('/tmp/sasquatch-inquiry-qa-output'); out.mkdir(exist_ok=True)
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
"""
cdp('Page.addScriptToEvaluateOnNewDocument', {'source': mock})

def load():
    cdp('Page.navigate', {'url': (root / 'proposal-sasquatch.html').as_uri()})
    for _ in range(30):
        pause(100)
        if js("!!document.getElementById('inquiry-submit') && document.readyState==='complete'"): break
    assert js("document.readyState==='complete'")
    assert not js("document.getElementById('inquiry-submit').disabled")
    assert not js("document.querySelector('.sample-dashboard-disclosure')")


def fill(package='package1'):
    js("""document.getElementById('package').value=%s;
 document.getElementById('package').dispatchEvent(new Event('change',{bubbles:true}));
 document.getElementById('contact-name').value='TEST ONLY';
 document.getElementById('contact-email').value='test@example.invalid';
 document.getElementById('message').value='TEST ONLY: I would like to discuss these options.\nThis is not an acceptance.';
 """.replace("options.\nThis", "options.\\nThis") % json.dumps(package))


def submit():
    js("document.getElementById('reply').requestSubmit()")
    pause()

report=[]
for missing in ['name', 'email', 'invalid_email', 'message', 'spaces_name', 'spaces_message']:
    load(); fill()
    expressions={
        'name': "document.getElementById('contact-name').value=''",
        'email': "document.getElementById('contact-email').value=''",
        'invalid_email': "document.getElementById('contact-email').value='not-an-email'",
        'message': "document.getElementById('message').value=''",
        'spaces_name': "document.getElementById('contact-name').value='   '",
        'spaces_message': "document.getElementById('message').value='   '",
    }
    js(expressions[missing]);submit();assert js('window.__requests.length')==0,missing
report.append({'validation':'name and email required; at least one comment on the working terms or message required; whitespace rejected'})
for package,fee in [('', 'No package selected'),('package1','$750/month'),('package2','$950/month')]:
    load();fill(package)
    js("document.getElementById('referral-answer').value='TEST ONLY referral reply';document.getElementById('invoice-payment-answer').value='TEST ONLY invoice reply';document.getElementById('platform-adaptation-answer').value='TEST ONLY platform reply';document.getElementById('two-month-checkin-answer').value='TEST ONLY checkin reply'")
    assert js("document.querySelectorAll('#reply input[type=checkbox],#signer-name,#accept-submit').length")==0
    assert not js("document.getElementById('package').required")
    if package:
        preview = js("document.getElementById('acceptance-summary').textContent")
        assert fee in preview and 'setup fee' not in preview.lower()
    js('window.__delay=350');submit()
    assert js("document.getElementById('reply').getAttribute('aria-busy')")=='true'
    submit();pause(450)
    assert js('window.__requests.length')==1
    assert js("document.getElementById('reply-status').dataset.state")=='success'
    request=js('window.__requests[0]');fields=request['fields']
    assert request['url']==js("document.getElementById('reply').action")
    assert fields['name']=='TEST ONLY' and fields['email']=='test@example.invalid'
    assert fields['message'].startswith('TEST ONLY:') and '\n' in fields['message']
    assert fields['referral_answer']=='TEST ONLY referral reply'
    assert fields['invoice_payment_answer']=='TEST ONLY invoice reply'
    assert fields['platform_adaptation_answer']=='TEST ONLY platform reply'
    assert fields['two_month_checkin_answer']=='TEST ONLY checkin reply'
    assert fields['submission_type']=='proposal_discussion'
    assert fields['no_commitment']=='Discussion only; this is not proposal acceptance.'
    assert fields['monthly_fee']==fee
    assert 'setup_fee' not in fields
    assert fields['package_id']==(package or 'undecided')
    assert fields['_subject'].startswith('Sasquatch proposal discussion')
    assert 'consent' not in fields and 'acceptance_record' not in fields
    assert 'signer_name' not in fields and 'signature' not in fields
    if package:
        assert '12 original short-video' in fields['scope_preview']
        assert ('20 new reviewers' in fields['scope_preview'])==(package=='package2')
        assert ('check comments, messages, and mentions' in fields['scope_preview'])==(package=='package2')
        assert ('short monthly summary' in fields['scope_preview'])==(package=='package2')
        assert 'dashboard' not in fields['scope_preview'].lower()
    status=js("document.getElementById('reply-status').textContent")
    assert 'respond by email' in status and 'haven’t committed' in status
    submit();assert js('window.__requests.length')==1
    report.append({'package':package or 'undecided','fee_context':fee,'discussion_payload_success_and_duplicate_guard':'passed'})
# Any working-terms comment can be sent without requiring an unrelated message.
for field,key in [('referral-answer','referral_answer'),('invoice-payment-answer','invoice_payment_answer'),('platform-adaptation-answer','platform_adaptation_answer'),('two-month-checkin-answer','two_month_checkin_answer')]:
    load();fill('')
    js("document.getElementById('message').value='';document.getElementById(%s).value='TEST ONLY answer without a message'" % json.dumps(field))
    submit()
    assert js("document.getElementById('reply-status').dataset.state")=='success'
    payload=js('window.__requests[0].fields')
    assert payload['message']==''
    assert payload[key]=='TEST ONLY answer without a message'
report.append({'typed_answers':'all 4 included in payload; each can be sent alone; no signature or commitment'})
for mode in ['http','rejected','malformed','network','abort']:
    load();fill();js('window.__mode=%s'%json.dumps(mode));submit()
    assert js("document.getElementById('reply-status').dataset.state")=='error',mode
    assert not js("document.getElementById('inquiry-submit').disabled")
    assert js("document.getElementById('message').value").startswith('TEST ONLY')
    request_id=js('window.__requests[0].fields.inquiry_id')
    js("window.__mode='ok'");submit()
    assert js("document.getElementById('reply-status').dataset.state")=='success'
    assert request_id==js('window.__requests[1].fields.inquiry_id')
report.append({'errors':'HTTP, rejected/malformed response, network and timeout; text preserved and retries reuse inquiry ID'})
load();fill('package2')
js("document.getElementById('referral-answer').value='TEST ONLY referral print value';document.getElementById('invoice-payment-answer').value='TEST ONLY invoice print value';document.getElementById('platform-adaptation-answer').value='TEST ONLY platform print value';document.getElementById('two-month-checkin-answer').value='TEST ONLY checkin print value'")
assert js("document.querySelector('#contact-name').nextElementSibling.id")=='proposal-details'
assert js("document.querySelectorAll('#questions-for-you textarea').length")==4
assert js("document.getElementById('referral-answer').form.id")=='reply'
assert js("document.getElementById('invoice-payment-answer').form.id")=='reply'
assert js("getComputedStyle(document.querySelector('.hp')).display")=='none'
assert js("document.querySelector('.hp').getAttribute('aria-hidden')")=='true'
assert js("document.getElementById('company-website').tabIndex")==-1
assert not js("document.body.innerText.includes('Leave this field empty')")
assert not js("document.body.innerText.includes('---')")
assert js("document.querySelectorAll('#questions-for-you details').length")==4
assert js("Array.from(document.querySelectorAll('#questions-for-you summary')).map(e=>e.textContent)")==['Platform adaptation','Invoice terms','Future direct work','Three-month check-in']
assert js("Array.from(document.querySelectorAll('summary')).filter(e=>e.textContent==='Future direct work').length")==1
assert js("Array.from(document.querySelectorAll('summary')).filter(e=>e.textContent==='Invoice terms').length")==1
for width,height in [(1440,1000),(390,844)]:
    cdp('Emulation.setDeviceMetricsOverride',{'width':width,'height':height,'deviceScaleFactor':1,'mobile':width<500});pause()
    assert js('document.documentElement.scrollWidth<=innerWidth')
    if width==1440:
        nav=js("Array.from(document.querySelectorAll('.service-index a')).map(a=>({display:getComputedStyle(a).display,top:a.getBoundingClientRect().top,bottom:a.getBoundingClientRect().bottom,height:a.getBoundingClientRect().height,target:!!document.querySelector(a.getAttribute('href'))}))")
        assert len(nav)==8 and all(a['display']=='flex' and a['height']>=44 and a['target'] for a in nav)
        assert all(nav[i]['top']>=nav[i-1]['bottom']+5 for i in range(1,len(nav)))
    else:
        assert js("document.querySelector('.top .nav-cta').getBoundingClientRect().width")>=44
    js("document.documentElement.style.scrollBehavior='auto';document.getElementById('reply').scrollIntoView({behavior:'instant'})");pause()
    rect=js("(()=>{let r=document.getElementById('reply').getBoundingClientRect();return {x:0,y:scrollY+r.top,width:innerWidth,height:r.height}})()")
    (out/f'form-{width}.png').write_bytes(base64.b64decode(cdp('Page.captureScreenshot',{'format':'png','captureBeyondViewport':True,'clip':dict(rect,scale=1)})['data']))
assert js("document.querySelector('meta[name=robots]').content")=='noindex, nofollow'
cdp('Emulation.setDeviceMetricsOverride',{'width':1440,'height':1000,'deviceScaleFactor':1,'mobile':False})
js("document.getElementById('proposal-details').open=false")
pdf=cdp('Page.printToPDF',{'printBackground':False,'preferCSSPageSize':True,'paperWidth':8.5,'paperHeight':11})
(out/'sasquatch-inquiry-print.pdf').write_bytes(base64.b64decode(pdf['data']))
text=' '.join(' '.join(p.extract_text().split()) for p in PdfReader(out/'sasquatch-inquiry-print.pdf').pages)
assert '$750/month' in text and '$950/month' in text and '25 days' in text
assert 'test@example.invalid' not in text and 'TEST ONLY:' not in text
assert 'TEST ONLY referral print value' not in text and 'TEST ONLY invoice print value' not in text
assert 'TEST ONLY platform print value' not in text and 'TEST ONLY checkin print value' not in text
assert text.count('Comments (optional)')==4
assert 'kickoff workshop' in text and 'hours' not in text
assert '$400' not in text and 'setup fee' not in text.lower()
assert 'reevaluate the scope and monthly fee' in text and 'will start in month four' in text
assert 'December 1, 2026 start' in text
assert 'dashboard' not in text.lower()
assert 'Leave this field empty' not in text and '---' not in text
assert not js("document.getElementById('proposal-details').open")
report.append({'layout':'desktop/mobile; proposal details below name; print includes terms and excludes contact/message values; noindex preserved'})
(out/'verification.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2));ws.close()
