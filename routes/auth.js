const router = require("express").Router()
const { authlogin, logout, register } = require("../controllers/auth")
// const { protectsuperadmin } = require("../middleware/middleware")

router
    .get("/login", authlogin)
    .get("/logout", logout)
    .post("/register", register)

module.exports = router;
