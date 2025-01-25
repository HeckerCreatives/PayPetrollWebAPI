const { getunclaimedincomeinventory, buytrainer, getinventory } = require("../controllers/inventory")
const { protectplayer } = require("../middleware/middleware")

const router = require("express").Router()


router 
.get("/getunclaimedincomeinventory", protectplayer, getunclaimedincomeinventory)
.get("/getinventory", protectplayer, getinventory)
.post("/buytrainer", protectplayer, buytrainer)

module.exports = router