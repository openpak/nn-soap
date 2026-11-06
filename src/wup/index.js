const express = require('express');
const subdomain = require('express-subdomain');
const logger = require('../logger');

const wupRouter = express.Router();

const ecsRouter = express.Router();
const iasRouter = express.Router();
const ccsRouter = express.Router();
const ccsCDNRouter = express.Router();
const samuraiRouter = express.Router();

const routes = require('./routes');

// Create subdomains
logger.info('[WUP] Creating \'ecs.wup.shop\' subdomain');
wupRouter.use(subdomain('ecs.wup.shop', ecsRouter));

logger.info('[WUP] Creating \'ias.wup.shop\' subdomain');
wupRouter.use(subdomain('ias.wup.shop', iasRouter));

logger.info('[WUP] Creating \'ccs.wup.shop\' subdomain');
wupRouter.use(subdomain('ccs.wup.shop', ccsRouter));

logger.info('[WUP] Creating \'ccs.cdn.wup.shop\' subdomain');
wupRouter.use(subdomain('ccs.cdn.wup.shop', ccsCDNRouter));

logger.info('[WUP] Creating \'samurai.wup.shop\' and \'ninja.wup.shop\' subdomains');
wupRouter.use(subdomain('samurai.wup.shop', samuraiRouter));
wupRouter.use(subdomain('ninja.wup.shop', samuraiRouter));

// Setup routes
logger.info('[WUP] Applying imported routes');
ecsRouter.use('/ecs/services/ECommerceSOAP', routes.ECOMMERCE);
iasRouter.use('/ias/services/IdentityAuthenticationSOAP', routes.IDENTIFY_AUTHENTICATION);
ccsRouter.use('/ccs', routes.CCS);
ccsCDNRouter.use('/ccs', routes.CCS_CDN);
samuraiRouter.use('/ninja', routes.NINJA);

module.exports = wupRouter;