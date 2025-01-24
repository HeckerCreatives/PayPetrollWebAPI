const { getwalletstatistics, playerwallethistory } = require("../controllers/wallethistory")
const { protectplayer } = require("../middleware/middleware")

const router = require("express").Router()

router
 .get("/getwalletstatistics", protectplayer, getwalletstatistics)
 .get("/playerwallethistory", protectplayer, playerwallethistory)
module.exports = router