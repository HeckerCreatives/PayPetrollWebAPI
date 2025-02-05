const { getLeaderboard, sendeventpoints, getLeaderboardHistory } = require("../controllers/leaderboard")
const { protectplayer, protectsuperadmin } = require("../middleware/middleware")

const router = require("express").Router()

router
.get("/getleaderboard", protectplayer, getLeaderboard)
.get("/getleaderboardhistory", protectsuperadmin, getLeaderboardHistory)

module.exports = router