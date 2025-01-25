const { getunclaimedincomeinventory } = require("../controllers/inventory")
const { protectplayer } = require("../middleware/middleware")

const router = require("express").Router()


router 
.get("/getunclaimedincomeinventory", protectplayer, getunclaimedincomeinventory)


module.exports = router