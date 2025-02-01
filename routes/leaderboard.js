const { getLeaderboard, sendeventpoints } = require("../controllers/leaderboard")
const { protectplayer } = require("../middleware/middleware")

const router = require("express").Router()

router
 .get("/getleaderboard", protectplayer, getLeaderboard)

module.exports = router