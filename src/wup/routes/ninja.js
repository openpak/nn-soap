const express = require('express');
const logger = require('../../logger');

const router = express.Router();

// Shop entry page probe (plan section 8, O1/C3). The eShop applet opens /ninja/wood_index.html in
// its WebKit view. Until our own shop UI exists, this page lists what the applet's JS environment
// exposes (global names and their types, never values) and posts that back to /ninja/probe, so
// the UI can be written against the real injected API. ponytail: probe only, replaced by the UI.
const PAGE = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>OpenPak eShop</title>
<style>body{font-family:sans-serif;background:#0b1020;color:#e8ecf8;margin:24px}h1{color:#35d0e0}pre{font-size:12px;white-space:pre-wrap}</style>
</head><body>
<h1>OpenPak eShop</h1>
<p>The OpenPak shop is being built. This page checks what your Wii U shop supports.</p>
<p id="s">Checking...</p>
<pre id="o"></pre>
<script>
(function () {
	var out = { ua: navigator.userAgent, href: location.href, globals: {} };
	function kind(v) { try { return v === null ? 'null' : typeof v; } catch (e) { return 'error'; } }
	var seen = {};
	for (var k in window) {
		if (seen[k]) continue; seen[k] = 1;
		var v; try { v = window[k]; } catch (e) { out.globals[k] = 'error'; continue; }
		var t = kind(v);
		if (t === 'object' && v && v !== window && v !== document && k.indexOf('webkit') !== 0) {
			var m = [];
			try { for (var j in v) { m.push(j + ':' + kind(v[j])); if (m.length > 200) break; } } catch (e) { m.push('error'); }
			out.globals[k] = m;
		} else {
			out.globals[k] = t;
		}
	}
	var std = /^(on|webkit)|^(document|window|self|top|parent|frames|location|navigator|history|screen|console|localStorage|sessionStorage|performance|crypto|styleMedia|clientInformation|external|opener|frameElement)$/;
	var lines = [];
	for (var n in out.globals) if (!std.test(n)) lines.push(n + ' = ' + JSON.stringify(out.globals[n]));
	document.getElementById('o').textContent = out.ua + '\\n\\n' + lines.join('\\n');
	var x = new XMLHttpRequest();
	x.open('POST', '/ninja/probe', true);
	x.setRequestHeader('Content-Type', 'application/json');
	x.onreadystatechange = function () { if (x.readyState === 4) document.getElementById('s').textContent = x.status === 204 ? 'Done, thank you.' : 'Could not send (' + x.status + ').'; };
	x.send(JSON.stringify(out));
})();
</script>
</body></html>`;

router.get('/wood_index.html', (request, response) => {
	response.set('Content-Type', 'text/html; charset=utf-8');
	response.set('Cache-Control', 'no-store');
	response.send(PAGE);
});

router.post('/probe', (request, response) => {
	const globals = (request.body && request.body.globals) || {};
	logger.info(`[WUP - NINJA] probe ua=${JSON.stringify(request.body && request.body.ua)} globals=${JSON.stringify(globals)}`);
	response.sendStatus(204);
});

module.exports = router;
