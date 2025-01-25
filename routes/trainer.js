const { getTrainers, edittrainer } = require("../controllers/trainer")
const { protectplayer, protectsuperadmin } = require("../middleware/middleware")

const router = require("express").Router()


router
.get("/gettrainers", protectplayer, getTrainers)
.post("/edittrainer", protectsuperadmin, edittrainer)

module.exports = router