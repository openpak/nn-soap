// Full request capture for protocol work (plan: wiiu-eshop-plan.md, P0).
//
// When NN_SOAP_CAPTURE_DIR is set, every request that reaches this service is written as one
// JSON line to <dir>/<YYYY-MM-DD>.jsonl: method, host, URL (query kept, secret-looking values
// masked), every header, the request body, the status and the time. Tokens, tickets, passwords
// and cookies are masked before anything is written. Old day files are removed after 90 days.
const fs = require('fs');
const path = require('path');

const dir = process.env.NN_SOAP_CAPTURE_DIR || '';
const MAX_BODY = 64 * 1024;
const KEEP_DAYS = 90;

const SECRET_NAME = /token|ticket|password|passwd|secret|auth|cookie|session|signature|cert|key|credential/i;
const MASK = '[redacted]';

function maskHeaders(headers) {
	const out = {};
	for (const [name, value] of Object.entries(headers)) {
		out[name] = SECRET_NAME.test(name) ? MASK : value;
	}
	return out;
}

function maskUrl(url) {
	const i = url.indexOf('?');
	if (i < 0) {
		return url;
	}
	const query = url.slice(i + 1).split('&').map(pair => {
		const eq = pair.indexOf('=');
		if (eq < 0) {
			return pair;
		}
		return SECRET_NAME.test(pair.slice(0, eq)) ? `${pair.slice(0, eq)}=${MASK}` : pair;
	}).join('&');
	return `${url.slice(0, i)}?${query}`;
}

function maskBody(text) {
	return text
		// XML elements such as <DeviceToken>, <ServiceTicket>, <Password>, <SessionHandle>
		.replace(/<((?:[A-Za-z0-9_]+:)?[A-Za-z0-9_]*(?:Token|Ticket|Password|Secret|Cookie|Handle|Signature|Cert)[A-Za-z0-9_]*)(\s[^>]*)?>[^<]+<\/\1>/gi,
			(_m, tag, attrs) => `<${tag}${attrs || ''}>${MASK}</${tag}>`)
		// JSON "name": "value"
		.replace(/("[A-Za-z0-9_.-]*(?:token|ticket|password|secret|cookie|session|signature|cert|key)[A-Za-z0-9_.-]*"\s*:\s*)"[^"]*"/gi, `$1"${MASK}"`)
		// form fields name=value
		.replace(/((?:^|&)[A-Za-z0-9_.-]*(?:token|ticket|password|secret|cookie|session|signature|cert|key)[A-Za-z0-9_.-]*=)[^&]*/gi, `$1${MASK}`);
}

function bodyText(buf) {
	if (!buf || buf.length === 0) {
		return { body: '', encoding: 'none', size: 0 };
	}
	const slice = buf.length > MAX_BODY ? buf.subarray(0, MAX_BODY) : buf;
	const text = slice.toString('utf8');
	// Treat as text only if it round-trips without replacement characters.
	if (!text.includes('�')) {
		return { body: maskBody(text), encoding: 'utf8', size: buf.length, truncated: buf.length > MAX_BODY };
	}
	return { body: slice.toString('base64'), encoding: 'base64', size: buf.length, truncated: buf.length > MAX_BODY };
}

function dayFile() {
	return path.join(dir, `${new Date().toISOString().slice(0, 10)}.jsonl`);
}

function prune() {
	const cutoff = Date.now() - KEEP_DAYS * 86400 * 1000;
	for (const name of fs.readdirSync(dir)) {
		const file = path.join(dir, name);
		try {
			if (name.endsWith('.jsonl') && fs.statSync(file).mtimeMs < cutoff) {
				fs.unlinkSync(file);
			}
		} catch (_error) { /* ignore */ }
	}
}

// Keeps the raw bytes of bodies that a body parser consumes.
function verify(request, _response, buf) {
	request.rawBody = buf;
}

function middleware(request, response, next) {
	if (!dir) {
		return next();
	}
	const started = Date.now();
	const chunks = [];
	let size = 0;
	const type = (request.headers['content-type'] || '').toLowerCase();
	// Only read the stream ourselves when no body parser will (octet-stream, no type, ...).
	const parsed = type.includes('json') || type.includes('urlencoded') || type.includes('xml');
	if (!parsed && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
		request.on('data', chunk => {
			if (size < MAX_BODY) {
				chunks.push(chunk);
			}
			size += chunk.length;
		});
	}

	response.on('finish', () => {
		let raw = request.rawBody;
		if (!raw && chunks.length) {
			raw = Buffer.concat(chunks);
		}
		const entry = {
			time: new Date().toISOString(),
			ms: Date.now() - started,
			remote: request.headers['x-forwarded-for'] || request.socket.remoteAddress,
			method: request.method,
			host: request.headers.host,
			url: maskUrl(request.originalUrl || request.url),
			status: response.statusCode,
			headers: maskHeaders(request.headers),
			request: bodyText(raw)
		};
		fs.appendFile(dayFile(), `${JSON.stringify(entry)}\n`, () => {});
	});
	next();
}

function init() {
	if (!dir) {
		return;
	}
	fs.mkdirSync(dir, { recursive: true });
	prune();
	setInterval(prune, 6 * 3600 * 1000).unref();
}

module.exports = { middleware, verify, init, maskBody, maskUrl };
