const { getLeaderboard, sendeventpoints, getLeaderboardHistory, getLeaderboardsa } = require("../controllers/leaderboard")
const { protectplayer, protectsuperadmin } = require("../middleware/middleware")

const router = require("express").Router()

router
.get("/getleaderboard", protectplayer, getLeaderboard)
.get("/getleaderboardsa", protectsuperadmin, getLeaderboardsa)
.get("/getleaderboardhistory", protectsuperadmin, getLeaderboardHistory)

module.exports = router