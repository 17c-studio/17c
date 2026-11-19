"""Browser regression checks. See proposals/ANALYTICS.md for local run instructions.
All GA collect requests are aborted before transmission; forms are never submitted.
Requires websocket-client and a local Chrome debugging instance on port 9223.
"""
import atexit
import json
import time
import urllib.parse
import urllib.request
from pathlib import Path
import websocket

ROOT = 'http://127.0.0.1:8765/'
targets = json.load(urllib.request.urlopen('http://127.0.0.1:9223/json'))
ws = websocket.create_connection(targets[0]['webSocketDebuggerUrl'], suppress_origin=True)
sequence = 0
traffic = []

def send(method, params=None):
    global sequence
    sequence += 1
    ws.send(json.dumps({'id': sequence, 'method': method, 'params': params or {}}))
    return sequence

def cdp(method, params=None):
    ident = send(method, params)
    while True:
        message = json.loads(ws.recv())
        if message.get('method') == 'Fetch.requestPaused':
            request = message['params']['request']
            traffic.append(request)
            send('Fetch.failRequest', {'requestId': message['params']['requestId'], 'errorReason': 'BlockedByClient'})
        if message.get('id') == ident:
            assert 'error' not in message, message
            return message.get('result', {})

def evaluate(expression):
    result = cdp('Runtime.evaluate', {'expression': expression, 'returnByValue': True, 'awaitPromise': True})
    assert 'exceptionDetails' not in result, result
    return result['result'].get('value')

def pause(ms=300):
    evaluate('new Promise(r=>setTimeout(r,%d))' % ms)

def load(page, query=''):
    traffic.clear()
    cdp('Page.navigate', {'url': ROOT + page + query})
    pause(1500)
    assert evaluate('document.readyState') == 'complete'

def layer():
    return evaluate("document.querySelector('iframe[title=\"Proposal analytics\"]')?.contentWindow.dataLayer?.filter(x=>typeof x[0]==='string').map(x=>Array.from(x)) || []")

def event_names():
    return [item[1] for item in layer() if item[0] == 'event']

def view_options():
    evaluate("document.documentElement.style.scrollBehavior='auto';document.querySelector('#investment').scrollIntoView({behavior:'instant'})")
    pause()

cdp('Page.enable')
cdp('Runtime.enable')
cdp('Network.enable')
cdp('Network.setCacheDisabled', {'cacheDisabled': True})
cdp('Network.setBlockedURLs', {'urls': []})
# This interception is enabled BEFORE navigating to any tracked page.
cdp('Fetch.enable', {'patterns': [{'urlPattern': '*collect*', 'requestStage': 'Request'}]})
cdp('Emulation.setDeviceMetricsOverride', {'width': 1280, 'height': 600, 'deviceScaleFactor': 1, 'mobile': False})
init = cdp('Page.addScriptToEvaluateOnNewDocument', {'source': "window.studioProposalAnalyticsDebug = true;history.scrollRestoration='manual';"})['identifier']
def cleanup():
    cdp('Network.setBlockedURLs', {'urls': ['*collect*']})
    cdp('Page.navigate', {'url': 'about:blank'})
    ws.close()
atexit.register(cleanup)

report = []
query = '?utm_source=17c_studio&utm_medium=email&utm_campaign=proposal&email=PRIVATE_EMAIL&name=PRIVATE_NAME&signature=PRIVATE_SIGNATURE&utm_term=PRIVATE_TERM#PRIVATE_HASH'
for page, ident in [('proposal-mr-rebuild.html', 'p001'), ('proposal-van-noord.html', 'p002'), ('proposal-estella-rose.html', 'p003')]:
    load(page, query)
    assert event_names() == ['proposal_open'], (page, event_names(), evaluate('({y:scrollY,top:document.querySelector("#investment").getBoundingClientRect().top,h:innerHeight})'))
    view_options()
    assert event_names() == ['proposal_open', 'proposal_options_view'], event_names()
    # Re-entry, resize, duplicate script, and form input must not add events.
    evaluate("window.scrollTo({top:0,behavior:'instant'});document.querySelector('input[type=email]').value='PRIVATE_FORM_VALUE';document.querySelector('input[type=email]').dispatchEvent(new Event('input',{bubbles:true}));const s=document.createElement('script');s.src='shared/js/proposal-analytics.js';s.dataset.proposalId='%s';s.dataset.enabled='true';document.body.append(s)" % ident)
    pause(); view_options()
    cdp('Emulation.setDeviceMetricsOverride', {'width': 390, 'height': 844, 'deviceScaleFactor': 1, 'mobile': True})
    pause()
    assert event_names() == ['proposal_open', 'proposal_options_view'], event_names()
    for command in layer():
        if command[0] == 'event':
            assert command[2]['proposal_id'] == ident
            assert command[2]['page_title'] == '17C Studio proposal ' + ident
            assert command[2]['page_referrer'] == ''
            assert command[2]['page_location'] == 'https://17c.studio/proposals/' + ident + '?utm_source=17c_studio&utm_medium=email&utm_campaign=proposal'
    pause(6500)
    assert traffic, 'No actual GA requests observed; inspect network access'
    wire = urllib.parse.unquote(json.dumps(traffic))
    for forbidden in ['PRIVATE_', page, 'Jordan', 'Kyle', 'Sara', 'Tricia', 'Annalisa', 'form_start', 'form_submit']:
        assert forbidden not in wire, forbidden
    for event in ['proposal_open', 'proposal_options_view']:
        assert event in wire, (event, wire)
    report.append({'page': page, 'id': ident, 'events_once': True, 'actual_requests_blocked': len(traffic), 'privacy': 'pass'})
    # Reload resets once-per-load guards.
    cdp('Emulation.setDeviceMetricsOverride', {'width': 1280, 'height': 600, 'deviceScaleFactor': 1, 'mobile': False})
    load(page)
    assert event_names() == ['proposal_open']
    assert 'utm_' not in json.dumps(layer())

# Unapproved, duplicate or incomplete campaign values must not be forwarded.
for query in ['?utm_source=PRIVATE_SOURCE&utm_medium=email&utm_campaign=proposal', '?utm_source=17c_studio&utm_medium=email&utm_campaign=proposal&utm_source=PRIVATE_SOURCE', '?utm_source=17c_studio']:
    load('proposal-van-noord.html', query)
    assert event_names() == ['proposal_open']
    assert 'utm_' not in json.dumps(layer()) and 'campaign_source' not in json.dumps(layer())

for page in ['proposal-spring-sweet.html', 'proposal-zcs.html', 'proposal-erf.html', 'proposal.html', 'proposal-template-17c.html']:
    load(page, query)
    # Ignore the previous enabled document's unload/engagement requests.
    traffic.clear()
    view_options()
    assert not evaluate("!!document.querySelector('iframe[title=\"Proposal analytics\"]')"), page
    assert not traffic, page
    assert not evaluate("!!document.querySelector('script[src*=googletagmanager]')"), page
    report.append({'page': page, 'inactive': True})

# Existing GA opt-out; explicit denied/pending consent; later grant and revoke.
for setting in ["window['ga-disable-G-YLJXMRYNPY']=true", "window.studioAnalyticsConsent='denied'", "window.studioAnalyticsConsent='pending'"]:
    hook = cdp('Page.addScriptToEvaluateOnNewDocument', {'source': setting})['identifier']
    load('proposal-van-noord.html')
    traffic.clear()
    view_options()
    assert not evaluate("!!document.querySelector('iframe[title=\"Proposal analytics\"]')")
    assert not traffic
    evaluate("window['ga-disable-G-YLJXMRYNPY']=false;window.studioAnalyticsConsent='granted';window.dispatchEvent(new Event('studio:analytics-consent'))")
    pause(1000)
    assert event_names() == ['proposal_open', 'proposal_options_view'], event_names()
    evaluate("window.studioAnalyticsConsent='denied';window.dispatchEvent(new Event('studio:analytics-consent'))")
    pause()
    evaluate("window.studioAnalyticsConsent='granted';window.dispatchEvent(new Event('studio:analytics-consent'))")
    pause()
    assert event_names() == ['proposal_open', 'proposal_options_view']
    cdp('Page.removeScriptToEvaluateOnNewDocument', {'identifier': hook})

# Pricing already visible at load (fragment) must still emit open first, then view.
load('proposal-van-noord.html', '#investment')
pause()
assert event_names() == ['proposal_open', 'proposal_options_view'], event_names()
# Exercise fallback when IntersectionObserver isn't supported.
hook = cdp('Page.addScriptToEvaluateOnNewDocument', {'source': 'delete window.IntersectionObserver;'})['identifier']
load('proposal-van-noord.html')
assert event_names() == ['proposal_open']
view_options()
assert event_names() == ['proposal_open', 'proposal_options_view']
cdp('Page.removeScriptToEvaluateOnNewDocument', {'identifier': hook})
cdp('Page.removeScriptToEvaluateOnNewDocument', {'identifier': init})
print(json.dumps({'proposals': report, 'reload_campaign_consent_fallback_fragment': 'pass', 'live_analytics_hits_sent': 0}, indent=2))
