const router = require("express").Router()
const { getuserdetails, updateuserprofile, getreferrallink, changepassworduser, changepassworduserforadmin, getuserdetailssuperadmin } = require("../controllers/user")
const { protectplayer, protectsuperadmin } = require("../middleware/middleware")
const pictureupload = require("../middleware/picuploads")

const uploadimg = pictureupload.single("file")

router
    .get("/getreferrallink", protectplayer, getreferrallink)
    .get("/getuserdetails", protectplayer, getuserdetails)
    .get("/getuserdetailssuperadmin", protectsuperadmin, getuserdetailssuperadmin)
    .post("/changepassworduser", protectplayer, changepassworduser)
    .post("/changepassworduserforadmin", protectsuperadmin, changepassworduserforadmin)
    .post("/updateuserprofile", protectplayer, updateuserprofile)

    // .get("/getplayerlist", protectsuperadmin, getplayerlist)
    // .get("/searchplayerlist", protectsuperadmin, searchplayerlist)
    // .get("/getplayercount", protectsuperadmin, getplayercount)
    // .post("/multiplebanusers", protectsuperadmin, multiplebanusers)
    // .post("/banunbanuser", protectsuperadmin, banunbanuser)

module.exports = router;
