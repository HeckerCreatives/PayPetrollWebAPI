const { getrequesthistoryplayer, requestpayout } = require("../controllers/payout")
const { protectplayer } = require("../middleware/middleware")

const router = require("express").Router()


router
 .get("/getrequesthistoryplayer", protectplayer, getrequesthistoryplayer)
 .post("/requestpayout", protectplayer, requestpayout)


module.exports = router