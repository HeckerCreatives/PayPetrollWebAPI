const router = require("express").Router()
const { getpayinhistoryplayer } = require("../controllers/payin");
const { processpayin, requestpayin } = require("../controllers/payin")
const { protectsuperadmin, protectplayer, protectadmin } = require("../middleware/middleware")

router
    .post("/processpayin", protectsuperadmin, processpayin)
    .post("/processpayinadmin", protectadmin, processpayin)


    .post("/requestpayin", protectplayer, requestpayin)
    .get("/getpayinhistoryplayer", protectplayer, getpayinhistoryplayer)

module.exports = router;
