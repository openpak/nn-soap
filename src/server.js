process.title = 'Pretendo - SOAP';

const express = require('express');
const morgan = require('morgan');
const xmlparser = require('./xml-middleware');
const logger = require('./logger');
const capture = require('./capture');
const config = require('./config.json');

const { http: { port } } = config;
const app = express();

const wup = require('./wup');
const ctr = require('./ctr');

// START APPLICATION
app.set('etag', false);
app.disable('x-powered-by');

// Create router
logger.info('Setting up Middleware');
// One line per request: method, path (never the query, which can carry tokens), status, duration.
morgan.token('path', request => (request.originalUrl || request.url || '').split('?')[0]);
app.use(morgan(':method :path -> :status :response-time[0]ms'));
// Full request capture (headers and bodies, secrets masked) when NN_SOAP_CAPTURE_DIR is set.
capture.init();
app.use(capture.middleware);
app.use(express.json({ verify: capture.verify }));
app.use(express.urlencoded({
	extended: true,
	verify: capture.verify
}));
app.use(xmlparser);

// console-specific implementations
app.use(wup);
app.use(ctr);

// 404 handler
logger.info('Creating 404 status handler');
app.use((request, response) => {
	logger.warn(`unhandled ${request.method} ${request.headers.host || '-'} ${(request.originalUrl || request.url || '').split('?')[0]}`);
	response.status(404);
	response.send();
});

// non-404 error handler
logger.info('Creating non-404 status handler');
app.use((error, request, response, _next) => {
	const status = error.status || 500;

	response.status(status);

	response.json({
		app: 'api',
		status,
		error: error.message
	});
});

// Starts the server
logger.info('Starting server');
app.listen(port, () => {
	logger.success(`Server started on port ${port}`);
});