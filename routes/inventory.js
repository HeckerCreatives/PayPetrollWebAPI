const { getunclaimedincomeinventory, buytrainer, getinventory, getinventoryhistory, claimtotalincome, gettotalpurchased, getplayerinventoryforadmin, getinventoryhistoryuseradmin, maxplayerinventorysuperadmin, deleteplayerinventorysuperadmin, deleteplayerinventoryhistorysuperadmin, dailyclaimhistorysa, dailyclaimhistory, deletedailyclaimhistorysa, buynfttrainer, getnftinventory, nftclaimtotalincome, maxplayernftinventorysuperadmin, deleteplayernftinventorysuperadmin, getplayernftinventory } = require("../controllers/inventory")
const { protectplayer, protectsuperadmin } = require("../middleware/middleware")

const router = require("express").Router()


router 
.get("/getunclaimedincomeinventory", protectplayer, getunclaimedincomeinventory)
.get("/getinventory", protectplayer, getinventory)
.get("/getnftinventory", protectplayer, getnftinventory)
.get("/getinventoryhistory", protectplayer, getinventoryhistory)
.get("/gettotalpurchased", protectplayer, gettotalpurchased)
.get("/dailyclaimhistory", protectplayer, dailyclaimhistory)
.post("/buytrainer", protectplayer, buytrainer)
.post("/buynfttrainer", protectplayer, buynfttrainer)
.post("/claimtotalincome", protectplayer, claimtotalincome)
.post("/nftclaimtotalincome", protectplayer, nftclaimtotalincome)
.get("/dailyclaimhistorysa", protectsuperadmin, dailyclaimhistorysa)
.get("/getplayernftinventory", protectsuperadmin, getplayernftinventory)
.get("/getinventoryhistoryuseradmin", protectsuperadmin, getinventoryhistoryuseradmin)
.get("/getplayerinventoryforadmin", protectsuperadmin, getplayerinventoryforadmin)
.post("/maxplayerinventorysuperadmin", protectsuperadmin, maxplayerinventorysuperadmin)
.post("/maxplayernftinventorysuperadmin", protectsuperadmin, maxplayernftinventorysuperadmin)
.post("/deleteplayerinventoryforadmin", protectsuperadmin, deleteplayerinventorysuperadmin)
.post("/deleteplayernftinventoryforadmin", protectsuperadmin, deleteplayernftinventorysuperadmin)
.post("/deleteplayerinventoryhistorysuperadmin", protectsuperadmin, deleteplayerinventoryhistorysuperadmin)
.post("/deletedailyclaimhistorysa", protectsuperadmin, deletedailyclaimhistorysa)

module.exports = router