const { getunclaimedincomeinventory, buytrainer, getinventory, getinventoryhistory, claimtotalincome, gettotalpurchased, getplayerinventoryforadmin, getinventoryhistoryuseradmin, maxplayerinventorysuperadmin } = require("../controllers/inventory")
const { protectplayer, protectsuperadmin } = require("../middleware/middleware")

const router = require("express").Router()


router 
.get("/getunclaimedincomeinventory", protectplayer, getunclaimedincomeinventory)
.get("/getinventory", protectplayer, getinventory)
.get("/getinventoryhistory", protectplayer, getinventoryhistory)
.get("/gettotalpurchased", protectplayer, gettotalpurchased)
.post("/buytrainer", protectplayer, buytrainer)
.post("/claimtotalincome", protectplayer, claimtotalincome)

.get("/getinventoryhistoryuseradmin", protectsuperadmin, getinventoryhistoryuseradmin)
.get("/getplayerinventoryforadmin", protectsuperadmin, getplayerinventoryforadmin)
.get("/maxplayerinventorysuperadmin", protectsuperadmin, maxplayerinventorysuperadmin)


module.exports = router