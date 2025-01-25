const { getunclaimedincomeinventory, buytrainer, getinventory, getinventoryhistory } = require("../controllers/inventory")
const { protectplayer } = require("../middleware/middleware")

const router = require("express").Router()


router 
.get("/getunclaimedincomeinventory", protectplayer, getunclaimedincomeinventory)
.get("/getinventory", protectplayer, getinventory)
.get("/getinventoryhistory", protectplayer, getinventoryhistory)
.post("/buytrainer", protectplayer, buytrainer)

module.exports = router