const router = require("express").Router()
const { getlistbuynft } = require("../controllers/nftlist")
const { protectsuperadmin, protectplayer, protectadmin } = require("../middleware/middleware")

router
    .get("/getlistbuynft", getlistbuynft)

module.exports = router;