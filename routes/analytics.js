const { getpayingraph } = require('../controllers/analytics');
const { protectsuperadmin } = require('../middleware/middleware');

const router = require('express').Router();

router
 .get("/payingraph", protectsuperadmin, getpayingraph)


module.exports = router;