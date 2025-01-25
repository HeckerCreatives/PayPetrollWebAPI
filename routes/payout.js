const { getrequesthistoryplayer } = require("../controllers/payout")
const { protectplayer } = require("../middleware/middleware")

const router = require("express").Router()


router
 .get("/getrequesthistoryplayer", protectplayer, getrequesthistoryplayer)


module.exports = router