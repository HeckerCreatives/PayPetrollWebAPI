const router = require("express").Router()
const { getingamelist, updateingamelist } = require("../controllers/ingame");
const { getmaintenance, changemaintenance, geteventmainte } = require("../controllers/maintenance")
const { protectsuperadmin, protectplayer } = require("../middleware/middleware")

router
    .get("/getingamelist", protectsuperadmin, getingamelist)
    .post("/updateingamelist", protectsuperadmin, updateingamelist)

module.exports = router;
