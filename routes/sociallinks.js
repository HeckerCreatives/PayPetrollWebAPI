const { getsociallinks, getspecificsociallink, createsociallink, editsociallink, deletesociallink } = require("../controllers/sociallinks")
const { protectsuperadmin } = require("../middleware/middleware")

const router = require("express").Router()

router
.get("/getsociallinksa", getsociallinks)
.get("/getspecificsociallink", getspecificsociallink)
.get("/getsociallinks", protectsuperadmin, getsociallinks)
.get("/getsociallinkslp", getsociallinks)
.get("/deletesociallink",protectsuperadmin, deletesociallink)
.post("/createsociallink", protectsuperadmin, createsociallink)
.post("/editsociallink", protectsuperadmin, editsociallink)

module.exports = router