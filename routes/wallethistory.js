const { getwalletstatistics } = require("../controllers/wallethistory")
const { protectplayer } = require("../middleware/middleware")

const router = require("express").Router()

router
 .get("/getwalletstatistics", protectplayer, getwalletstatistics)

module.exports = router