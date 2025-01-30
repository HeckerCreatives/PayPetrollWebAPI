const { getpayingraph, gettotalpayinperday } = require('../controllers/analytics');
const { protectsuperadmin } = require('../middleware/middleware');

const router = require('express').Router();

router
 .get("/payingraph", protectsuperadmin, getpayingraph)
 .get("/gettotalpayinperday", protectsuperadmin, gettotalpayinperday)

module.exports = router;