"""Spring Sweet acceptance regression checks; no live submissions.
Run Chrome separately with --headless --remote-debugging-port=9223 and an isolated
--user-data-dir. Requires Python 3 and websocket-client; run from the repo root.
Formspree and Analytics network requests are blocked before any page is loaded.
"""
import atexit
import json
import urllib.request
from pathlib import Path
import websocket

targets = json.load(urllib.request.urlopen('http://127.0.0.1:9223/json'))
ws = websocket.create_connection(next(t for t in targets if t['type'] == 'page')['webSocketDebuggerUrl'], suppress_origin=True)
sequence = 0

def cdp(method, params=None):
    global sequence
    sequence += 1
    ident = sequence
    ws.send(json.dumps({'id': ident, 'method': method, 'params': params or {}}))
    while True:
        message = json.loads(ws.recv())
        if message.get('id') == ident:
            assert 'error' not in message, message
            return message.get('result', {})

def evaluate(expression):
    result = cdp('Runtime.evaluate', {'expression': expression, 'returnByValue': True, 'awaitPromise': True})
    assert 'exceptionDetails' not in result, result
    return result['result'].get('value')

def pause(ms=300):
    evaluate('new Promise(r=>setTimeout(r,%d))' % ms)

def cleanup():
    try:
        cdp('Page.navigate', {'url': 'about:blank'})
    finally:
        ws.close()

atexit.register(cleanup)
import hashlib,base64
out=Path('/tmp/spring-form-qa-output');out.mkdir(exist_ok=True)
cdp('Page.enable');cdp('Runtime.enable');cdp('Network.enable');cdp('Network.setBlockedURLs',{'urls':['*formspree.io/*','*collect*']})
cdp('Emulation.setDeviceMetricsOverride',{'width':1440,'height':1000,'deviceScaleFactor':1,'mobile':False})
fixture='''window.__calls=[];window.__response='success';window.__delay=false;window.fetch=async(url,options)=>{window.__calls.push({url,payload:Object.fromEntries(options.body.entries())});if(window.__delay)await new Promise(r=>window.__release=r);if(window.__response==='network')throw new TypeError('Offline');if(window.__response==='malformed')return {ok:true,json:async()=>{throw Error('not JSON')}};if(window.__response==='rejected')return {ok:false,status:422,json:async()=>({errors:[{message:'TEST rejected'}]})};return {ok:true,json:async()=>({ok:true})};};'''
init=cdp('Page.addScriptToEvaluateOnNewDocument',{'source':'window.__testLoaded=true;'+fixture})['identifier']
def load():
 evaluate('window.__testLoaded=false')
 cdp('Page.navigate',{'url':Path('proposal-spring-sweet.html').resolve().as_uri()})
 for _ in range(100):
  pause(100)
  if evaluate("window.__testLoaded===true&&document.readyState==='complete'&&!!window.jspdf&&!!document.getElementById('reply')"):break
 assert evaluate("window.__testLoaded===true&&!!window.__calls&&!!window.jspdf?.jsPDF"),'Test fixture or PDF library unavailable'
def fill(opt,care):
 evaluate('''(()=>{const f=id=>document.getElementById(id);f('option').value=%s;f('care').value=%s;f('care').dispatchEvent(new Event('change',{bubbles:true}));f('name').value='TEST Local QA';f('email').value='test@example.invalid';f('accept-consent').checked=true;})()'''%(json.dumps(opt),json.dumps(care)))
def submit():evaluate("document.getElementById('reply').requestSubmit()")
def wait_done():
 for _ in range(100):
  pause(50)
  if evaluate("!document.getElementById('reply').hasAttribute('aria-busy')"):return
 raise AssertionError('Submission stayed busy')
# Capture PDFs from the real library, without changing form behavior.
def capture_pdf():
 evaluate("const Original=window.jspdf.jsPDF;window.jspdf.jsPDF=function(...args){const pdf=new Original(...args),output=pdf.output.bind(pdf);pdf.output=(type,...rest)=>{if(type==='blob')window.__pdf=output('datauristring').split(',')[1];return output(type,...rest)};return pdf}")
results=[]
for opt,fee in [('opt1',3500),('opt2',6500),('opt3',11500)]:
 for care,monthly,total in [('site',300,900),('growth',600,1800),('none',0,0)]:
  load();capture_pdf();fill(opt,care);submit();wait_done()
  calls=evaluate('window.__calls');assert len(calls)==1,calls
  payload=calls[0]['payload'];assert calls[0]['url']=='https://formspree.io/f/xjygqoja'
  record=json.loads(payload['acceptance_record']);selected=record['selected']
  assert selected['fee']==fee and selected['deposit']==fee/2,selected
  assert selected['care']['monthly']==monthly and selected['care']['total']==total,selected
  assert payload['project_fee']=='${:,}'.format(fee)
  assert payload['final_invoice']=='${:,.0f}'.format(fee/2)
  assert payload['final_payment_timing']==selected['final_payment_timing']
  assert 'once the final phase is approved' in payload['final_payment_timing']
  assert '7 days' in payload['final_payment_timing']
  assert payload['care_initial_commitment']==str(total)
  assert 'signature_png' not in record
  digest=record.pop('evidence_sha256')
  assert hashlib.sha256(json.dumps(record,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()==digest
  assert 'Spring Sweet' in payload['_subject'] and record['document']['terms']
  assert evaluate("document.getElementById('reply-status').dataset.state")=='success'
  assert evaluate("!document.getElementById('acceptance-receipt').hidden")
  assert evaluate("document.getElementById('accept-submit').disabled")
  assert evaluate("!document.getElementById('download-acceptance-pdf').disabled")
  submit();assert evaluate('window.__calls.length')==1
  if opt=='opt3' and care=='growth':
   pdf=evaluate('window.__pdf');assert pdf
   (out/'spring-sweet-signed-test.pdf').write_bytes(base64.b64decode(pdf))
  results.append([opt,care,'pass'])
# Validation blocks missing selections, consent and blank-only names.
load();submit();assert evaluate('window.__calls.length')==0
fill('opt2','site');evaluate("document.getElementById('accept-consent').checked=false");submit();assert evaluate('window.__calls.length')==0
fill('opt2','site');evaluate("document.getElementById('name').value='   '");submit();assert evaluate('window.__calls.length')==0
# Editing the selection resets consent and recalculates the summary.
fill('opt2','site');evaluate("document.getElementById('care').value='growth';document.getElementById('care').dispatchEvent(new Event('change',{bubbles:true}))")
assert evaluate("!document.getElementById('accept-consent').checked")
assert '$1,800' in evaluate("document.getElementById('acceptance-summary').textContent")
# Failed and malformed responses remain retryable; success requires ok:true JSON.
for mode in ['rejected','malformed','network']:
 load();fill('opt2','growth');evaluate('window.__response='+json.dumps(mode));submit();wait_done()
 assert evaluate("document.getElementById('reply-status').dataset.state")=='error',mode
 assert evaluate("document.getElementById('name').value")=='TEST Local QA'
 assert evaluate("document.getElementById('acceptance-receipt').hidden")
 assert evaluate("!document.getElementById('accept-submit').disabled")
 evaluate("window.__response='success'");submit();wait_done()
 assert evaluate("document.getElementById('reply-status').dataset.state")=='success'
 assert evaluate('window.__calls.length')==2
 # Retrying the unchanged acceptance keeps the same reference.
 assert evaluate("window.__calls[0].payload.acceptance_id===window.__calls[1].payload.acceptance_id")
# A second submit while the first is pending must not send another request.
load();fill('opt1','none');evaluate('window.__delay=true');submit();pause(200);submit();assert evaluate('window.__calls.length')==1
evaluate('window.__release()');wait_done()
# PDF-unavailable state blocks signing before anything is delivered.
load();evaluate('window.jspdf=undefined');fill('opt1','none');submit();wait_done();assert evaluate('window.__calls.length')==0
assert 'Nothing was sent' in evaluate("document.getElementById('reply-status').textContent")
# Capture active form, after the opening animation ends.
load();fill('opt3','growth');pause(3000)
for label,width,height,mobile in [('desktop',1440,1000,False),('mobile',390,1000,True)]:
 cdp('Emulation.setDeviceMetricsOverride',{'width':width,'height':height,'deviceScaleFactor':1,'mobile':mobile})
 evaluate("document.documentElement.style.scrollBehavior='auto';document.getElementById('accept-section').scrollIntoView({behavior:'instant'})")
 pause();assert evaluate('document.documentElement.scrollWidth<=innerWidth')
 (out/(label+'.png')).write_bytes(base64.b64decode(cdp('Page.captureScreenshot',{'format':'png'})['data']))
print(json.dumps({'combinations':results,'validation_errors_retries_duplicates_pdf': 'pass','live_submissions':0},indent=2))
cdp('Page.removeScriptToEvaluateOnNewDocument',{'identifier':init})
