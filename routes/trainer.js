const { getNfttrainer, editNfttrainer } = require("../controllers/Nfttrainer")
const { getTrainers, edittrainer, getusertrainer } = require("../controllers/trainer")
const { protectplayer, protectsuperadmin } = require("../middleware/middleware")

const router = require("express").Router()


router
.get("/gettrainers", protectplayer, getTrainers)
.get("/getnfttrainers", protectplayer, getNfttrainer) 
.get("/getusertrainer", protectplayer, getusertrainer)
.get("/gettrainersadmin", protectsuperadmin, getTrainers)
.get("/getnfttrainersadmin", protectsuperadmin, getNfttrainer) 
.post("/edittrainer", protectsuperadmin, edittrainer)
.post("/editnfttrainer", protectsuperadmin, editNfttrainer)

module.exports = router