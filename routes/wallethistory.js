const { getwalletstatistics, playerwallethistory, getplayerwallethistoryforadmin, gettopcommissions, editplayerwallethistoryforadmin, deleteplayerwallethistoryforadmin, createplayerwallethistoryforadmin, getwalletstatisticssuperadmin } = require("../controllers/wallethistory")
const { protectplayer, protectsuperadmin } = require("../middleware/middleware")

const router = require("express").Router()

router
 .get("/getwalletstatistics", protectplayer, getwalletstatistics)
 .get("/getwalletstatisticssuperadmin", protectsuperadmin, getwalletstatisticssuperadmin)
 .get("/playerwallethistory", protectplayer, playerwallethistory)
 .get("/getplayerwallethistoryforadmin", protectsuperadmin, getplayerwallethistoryforadmin)
 .get("/gettopcommissions", protectsuperadmin, gettopcommissions)
 .post("/editplayerwallethistoryforadmin", protectsuperadmin, editplayerwallethistoryforadmin)
 .post("/createplayerwallethistoryforadmin", protectsuperadmin, createplayerwallethistoryforadmin)
 .post("/deleteplayerwallethistoryforadmin", protectsuperadmin, deleteplayerwallethistoryforadmin)
 
module.exports = router