const express = require('express');
const logger = require('../../logger');

const router = express.Router();

// Shop entry page probe (plan section 8, O1/C3). The eShop applet opens /ninja/wood_index.html in
// its WebKit view. Until our own shop UI exists, this page lists what the applet's JS environment
// exposes (global names and their types, never values) and posts that back to /ninja/probe, so
// the UI can be written against the real injected API. ponytail: probe only, replaced by the UI.
const PAGE = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>OpenPak eShop</title>
<style>body{font-family:sans-serif;background:#0b1020;color:#e8ecf8;margin:24px;font-size:20px}h1{color:#35d0e0}pre{font-size:12px;white-space:pre-wrap}</style>
</head><body>
<h1>OpenPak eShop</h1>
<p>The OpenPak shop is being built. If you can read this, the page is showing. Touch the screen once.</p>
<pre id="o" style="font-size:12px"></pre>
<script>
// Start-up trace. Each step is a named call; its result or exception and the elapsed ms go in
// a log that is POSTed to /ninja/probe at several moments, so one console run tells which
// ordering/timing/trigger made the applet drop its start-up screen. Look for step names in
// the "[WUP - NINJA] trace" log lines.
var LOG = [], T0 = new Date().getTime(), SENT = 0;
function el() { return new Date().getTime() - T0; }
function say(t) { var o = document.getElementById('o'); if (o) o.appendChild(document.createTextNode(t + '\\n')); }
function step(name, obj, fn) {
	var a = Array.prototype.slice.call(arguments, 3), r;
	try {
		if (!window[obj] || typeof window[obj][fn] !== 'function') { r = 'MISSING'; }
		else { r = window[obj][fn].apply(window[obj], a); r = 'ok:' + (typeof r === 'object' ? 'object' : String(r)); }
	} catch (e) { r = 'EXC:' + e; }
	LOG.push(el() + 'ms ' + name + ' ' + obj + '.' + fn + '(' + a.join(',') + ') -> ' + r);
	say(LOG[LOG.length - 1]);
}
function note(t) { LOG.push(el() + 'ms ' + t); say(LOG[LOG.length - 1]); }
function send(tag) {
	note('SEND ' + tag + ' readyState=' + document.readyState);
	var x = new XMLHttpRequest();
	x.open('POST', '/ninja/probe', true);
	x.setRequestHeader('Content-Type', 'application/json');
	x.send(JSON.stringify({ kind: 'trace', tag: tag, ua: navigator.userAgent, href: location.href, log: LOG.slice(SENT) }));
	SENT = LOG.length;
}
window.onerror = function (m, u, l) { note('onerror ' + m + ' @' + l); };

// Stage A: immediately (parsing). Read state first, then the Miiverse-style endStartUp.
note('start readyState=' + document.readyState);
step('A1', 'wiiuSystemSetting', 'getEShopInitialized');
step('A2', 'wiiuBrowser', 'endStartUp');
step('A3', 'wiiuCurtain', 'open');
step('A4', 'wiiuSystemSetting', 'getEShopInitialized');

window.addEventListener('load', function () {
	// Stage B: on load, curtain first then endStartUp (opposite order to A).
	note('load event');
	step('B1', 'wiiuCurtain', 'open');
	step('B2', 'wiiuBrowser', 'endStartUp');
	step('B3', 'wiiuBrowser', 'lockUserOperation', false);
	send('after-load');
	// Stage C: loading hides.
	setTimeout(function () {
		step('C1', 'wiiuDialog', 'hideLoading');
		step('C2', 'wiiuBrowser', 'showLoadingIcon', false);
		step('C3', 'wiiuBrowser', 'prohibitLoadingIcon', false);
		send('after-hides');
	}, 1500);
	// Stage D: mark the eShop initialised, then repeat endStartUp and curtain.
	setTimeout(function () {
		step('D1', 'wiiuSystemSetting', 'setEShopInitialized', true);
		step('D2', 'wiiuSystemSetting', 'getEShopInitialized');
		step('D3', 'wiiuBrowser', 'endStartUp');
		step('D4', 'wiiuCurtain', 'open');
		send('after-initialized');
	}, 4000);
	// Stage E: prove the injected API reaches the applet at all: a native dialog.
	setTimeout(function () {
		step('E1', 'wiiuDialog', 'alert', 'OpenPak trace E1');
		send('after-alert');
	}, 7000);
	// Stage F: navigate to a second same-origin page (full navigation after the above).
	setTimeout(function () { note('F navigate'); send('before-navigate'); location.href = '/ninja/wood_second.html'; }, 11000);
});
// Any touch or button press repeats the whole set (user interaction hypothesis).
function all(tag) {
	step(tag + '1', 'wiiuBrowser', 'endStartUp');
	step(tag + '2', 'wiiuCurtain', 'open');
	step(tag + '3', 'wiiuDialog', 'hideLoading');
	step(tag + '4', 'wiiuBrowser', 'showLoadingIcon', false);
	send(tag);
}
document.addEventListener('touchstart', function () { if (!window.__t) { window.__t = 1; all('touch'); } }, false);
document.addEventListener('click', function () { if (!window.__c) { window.__c = 1; all('click'); } }, false);
</script>
</body></html>`;

router.get('/wood_index.html', (request, response) => {
	response.set('Content-Type', 'text/html; charset=utf-8');
	response.set('Cache-Control', 'no-store');
	response.send(PAGE);
});

router.get('/wood_second.html', (request, response) => {
	response.set('Content-Type', 'text/html; charset=utf-8');
	response.set('Cache-Control', 'no-store');
	response.send('<!DOCTYPE html><html><head><meta charset="utf-8"><title>OpenPak eShop 2</title></head><body style="background:#0b1020;color:#e8ecf8;font-size:24px" onload="try{wiiuBrowser.endStartUp();wiiuCurtain.open();}catch(e){}">'
		+ '<h1>OpenPak eShop, second page</h1><p>Page 2 loaded.</p><script>var x=new XMLHttpRequest();x.open("POST","/ninja/probe",true);x.setRequestHeader("Content-Type","application/json");x.send(JSON.stringify({kind:"trace",tag:"page2",log:["page2 loaded"]}));</script></body></html>');
});

router.post('/probe', (request, response) => {
	if (request.body && request.body.kind === 'trace') {
		logger.info(`[WUP - NINJA] trace tag=${request.body.tag} ${JSON.stringify(request.body.log)}`);
		return response.sendStatus(204);
	}
	const globals = (request.body && request.body.globals) || {};
	logger.info(`[WUP - NINJA] probe ua=${JSON.stringify(request.body && request.body.ua)} globals=${JSON.stringify(globals)}`);
	response.sendStatus(204);
});

module.exports = router;
