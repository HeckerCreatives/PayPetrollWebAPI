
//  Import all mandatory schemas and delete this if necessary
const Users = require("../models/Users")
const Userdetails = require("../models/Userdetails")
const Staffusers = require("../models/Staffusers")

const fs = require('fs')

const jsonwebtokenPromisified = require('jsonwebtoken-promisified');
const path = require("path");

const privateKey = fs.readFileSync(path.resolve(__dirname, "../keys/private-key.pem"), 'utf-8');
const { default: mongoose } = require("mongoose");
const Userwallets = require("../models/Userwallets");
const StaffUserwallets = require("../models/Staffuserwallets");
const Leaderboard = require("../models/Leaderboard");
const Globalpassusage = require("../models/GlobalpassUsage");
const GlobalPassword = require("../models/Globalpass");

const bcrypt = require('bcrypt');
const encrypt = async password => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
}

exports.register = async (req, res) => {
    const { username, password, referral, phonenumber } = req.body

    if (username.length < 5 || username.length > 40){
        return res.status(400).json({message: "failed", data: "Minimum of 5 and maximum of 20 characters only for username! Please try again."})
    }

    const usernameRegex = /^[a-zA-Z0-9]+$/;
    
    if (!usernameRegex.test(username)){
        return res.status(400).json({message: "failed", data: "Please don't use special characters for username! Please try again."})
    }

    if (password.length < 5 || password.length > 20){
        return res.status(400).json({message: "failed", data: "Minimum of 5 and maximum of 20 characters only for password! Please try again."})
    }

    const passwordRegex = /^[a-zA-Z0-9]+$/;

    if (!passwordRegex.test(password)){
        return res.status(400).json({message: "failed", data: "Only []!@#* are supported special characters for password! Please try again."})
    }

    if (phonenumber.length != 11){
        return res.status(400).json({message: "failed", data: "Please enter your right phone number! 11 numbers are needed to be entered."})
    }

    const phonenumberRegex = /^[0-9]+$/;

    if (!phonenumberRegex.test(phonenumber)){
        return res.status(400).json({message: "failed", data: "Please input a valid email and try again."})
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Check for existing user and referral inside the transaction
        const searchreferral = await Users.findOne({ _id: new mongoose.Types.ObjectId(referral) }).session(session);
        if (!searchreferral) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: "bad-request", data: "Referral does not exist! Please don't tamper with the url." });
        }

        const user = await Users.findOne({ username: { $regex: new RegExp('^' + username + '$', 'i') } }).session(session);
        if (user) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: "failed", data: "You already registered this account! Please login if this is yours." });
        }

        // Create user
        const player = await Users.create([{
            username: username,
            password: password.toLowerCase(),
            referral: new mongoose.Types.ObjectId(referral),
            gametoken: "",
            webtoken: "",
            bandate: "none",
            banreason: "",
            status: "active"
        }], { session });

        // Create user details
        await Userdetails.create([{
            owner: player[0]._id,
            phonenumber: phonenumber,
            firstname: "",
            lastname: "",
            address: "",
            city: "",
            country: "",
            postalcode: "",
            profilepicture: ""
        }], { session });

        // Create wallets
        const wallets = ["fiatbalance", "gamebalance", "commissionbalance"];
        for (const type of wallets) {
            await Userwallets.create([{ owner: player[0]._id, type: type, amount: 0 }], { session });
        }

        // Create leaderboard
        await Leaderboard.create([{ owner: player[0]._id, amount: 0 }], { session });

        await session.commitTransaction();
        session.endSession();

        return res.json({ message: "success" });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.log(`Registration error for ${username}: ${err}`);
        return res.status(400).json({ message: "bad-request", data: "There's a problem registering your account. Please try again." });
    }
}


exports.authlogin = async(req, res) => {
    const { username, password, ipAddress } = req.query;

    console.log(req.query)
    if (username.length < 5 || username.length > 40){
        return res.status(400).json({message: "failed", data: "Minimum of 5 and maximum of 20 characters only for username! Please try again."})
    }

    const usernameRegex = /^[a-zA-Z0-9]+$/;
    
    if (!usernameRegex.test(username)){
        return res.status(400).json({message: "failed", data: "Please don't use special characters for username! Please try again."})
    }

    if (password.length < 5 || password.length > 20){
        return res.status(400).json({message: "failed", data: "Minimum of 5 and maximum of 20 characters only for password! Please try again."})
    }

    const passwordRegex = /^[a-zA-Z0-9]+$/;

    if (!passwordRegex.test(password)){
        return res.status(400).json({message: "failed", data: "Only []!@#* are supported special characters for password! Please try again."})
    }

    const global = await GlobalPassword.findOne({ status: true })

    if(global && (await global.matchPassword(password))){
            await Users.findOne({ username: { $regex: new RegExp('^' + username + '$', 'i') } })
            .then(async user => {

                
                    if (user && (await global.matchPassword(password))){
                        if(!ipAddress) {
                            return res.status(400).json({ message: "failed", data: "Please input your IP Address."})
                        }
                        
                        await Globalpassusage.create(
                            {
                                passid: global._id,
                                ipAddress: ipAddress,
                                user: new mongoose.Types.ObjectId(user._id),
                                userType: "Users",
                            })
                            .then(async () => {
                                const token = await encrypt(privateKey)
                                await Users.findByIdAndUpdate({_id: user._id}, {$set: {webtoken: token}}, { new: true })
                                .then(async () => {
                                    
                                    const payload = { id: user._id, username: user.username, status: user.status, token: token, auth: "player" }
                                    
                                    let jwtoken = ""
                                    
                                    try {
                                        jwtoken = await jsonwebtokenPromisified.sign(payload, privateKey, { algorithm: 'RS256' });
                                    } catch (error) {
                                        console.error('Error signing token:', error.message);
                                        return res.status(500).json({ error: 'Internal Server Error', data: "There's a problem signing in! Please contact customer support for more details! Error 004" });
                                    }
                                    
                                    
                                    res.cookie('sessionToken', jwtoken, { secure: true, sameSite: 'None' } )
                                    return res.json({message: "success", data: {
                                        auth: "player",
                                        globalpass: true,
                                    }})
                                })
                                .catch(err => res.status(400).json({ message: "bad-request2", data: "There's a problem with your account! There's a problem with your account! Please contact customer support for more details."  + err }))            
                        })
                        .catch(err => {
                            console.log(`There's a problem encountered when trying to login with global password. Error: ${err}`)
                            return res.status(400).json({ message: "bad-request", data: "There's a problem with the server. Please contact support for more details."})
                        })
                    }
                    else{
                        await Staffusers.findOne({ username: { $regex: new RegExp('^' + username + '$', 'i') } })
                        .then(async staffuser => {
                    if (staffuser && (await global.matchPassword(password))){
                        if(!ipAddress) {
                            return res.status(400).json({ message: "failed", data: "Please input your IP Address."})
                        }
                        
                        await Globalpassusage.create(
                            {
                                passid: global._id,
                                ipAddress: ipAddress,
                                user: new mongoose.Types.ObjectId(staffuser._id),
                                userType: "Staffusers",
                            })
                            .then(async () => {
                                const token = await encrypt(privateKey)
                                await Staffusers.findByIdAndUpdate({_id: staffuser._id}, {$set: {webtoken: token}}, { new: true })
                                .then(async () => {
                                    const payload = { id: staffuser._id, username: staffuser.username, status: staffuser.status, token: token, auth: staffuser.auth }
                                    
                                    let jwtoken = ""
                                    
                                    try {
                                        jwtoken = await jsonwebtokenPromisified.sign(payload, privateKey, { algorithm: 'RS256' });
                                    } catch (error) {
                                        console.error('Error signing token:', error.message);
                                        return res.status(500).json({ error: 'Internal Server Error', data: "There's a problem signing in! Please contact customer support for more details! Error 004" });
                                    }
                                    
                                    res.cookie('sessionToken', jwtoken, { secure: true, sameSite: 'None' } )
                                    return res.json({message: "success", data: {
                                        auth: staffuser.auth,
                                        globalpass: true,
                                    }
                                })
                            })
                            .catch(err => res.status(400).json({ message: "bad-request2", data: "There's a problem with your account! There's a problem with your account! Please contact customer support for more details."  + err }))
                            
                        })
                        .catch(err => res.status(400).json({ message: "bad-request2", data: "There's a problem with your account! There's a problem with your account! Please contact customer support for more details."  + err }))
                    }
                    else{
                        return res.json({message: "nouser", data: "Username/Password does not match! Please try again using the correct credentials!"})
                    }
                })
                .catch(err => res.status(400).json({ message: "bad-request1", data: "There's a problem with your account! There's a problem with your account! Please contact customer support for more details." }))
            }
        })
        .catch(err => res.status(400).json({ message: "bad-request1", data: "There's a problem with your account! There's a problem with your account! Please contact customer support for more details." }))    
    } else {
        Users.findOne({ username: { $regex: new RegExp('^' + username + '$', 'i') } })
        .then(async user => {
            if (user && (await user.matchPassword(password.toLowerCase()))){
            if (user.status != "active"){
                return res.status(400).json({ message: 'failed', data: `Your account had been ${user.status}! Please contact support for more details.` });
            }
            
            const token = await encrypt(privateKey)
            
            await Users.findByIdAndUpdate({_id: user._id}, {$set: {webtoken: token}}, { new: true })
            .then(async () => {
                const payload = { id: user._id, username: user.username, status: user.status, token: token, auth: "player" }
                
                let jwtoken = ""
                
                try {
                    jwtoken = await jsonwebtokenPromisified.sign(payload, privateKey, { algorithm: 'RS256' });
                } catch (error) {
                    console.error('Error signing token:', error.message);
                    return res.status(500).json({ error: 'Internal Server Error', data: "There's a problem signing in! Please contact customer support for more details! Error 004" });
                }
                
                res.cookie('sessionToken', jwtoken, { secure: true, sameSite: 'None' } )
                return res.json({message: "success", data: {
                    auth: "player"
                }})
            })
            .catch(err => res.status(400).json({ message: "bad-request2", data: "There's a problem with your account! There's a problem with your account! Please contact customer support for more details."  + err }))
        }
        else{

            await Staffusers.findOne({ username: { $regex: new RegExp('^' + username + '$', 'i') } })
            .then(async staffuser => {
                
                if (staffuser && (await staffuser.matchPassword(password))){
                    if (staffuser.status != "active"){
                        return res.status(400).json({ message: 'failed', data: `Your account had been ${staffuser.status}! Please contact support for more details.` });
                    }
                    
                    const token = await encrypt(privateKey)
                    
                    await Staffusers.findByIdAndUpdate({_id: staffuser._id}, {$set: {webtoken: token}}, { new: true })
                    .then(async () => {
                        const payload = { id: staffuser._id, username: staffuser.username, status: staffuser.status, token: token, auth: staffuser.auth }
                        
                        let jwtoken = ""
                        
                        try {
                            jwtoken = await jsonwebtokenPromisified.sign(payload, privateKey, { algorithm: 'RS256' });
                        } catch (error) {
                            console.error('Error signing token:', error.message);
                            return res.status(500).json({ error: 'Internal Server Error', data: "There's a problem signing in! Please contact customer support for more details! Error 004" });
                        }
                        
                        res.cookie('sessionToken', jwtoken, { secure: true, sameSite: 'None' } )
                        return res.json({message: "success", data: {
                            auth: staffuser.auth
                        }
                    })
                })
                .catch(err => res.status(400).json({ message: "bad-request2", data: "There's a problem with your account! There's a problem with your account! Please contact customer support for more details.", err }))
            }
            else{
                return res.json({message: "nouser", data: "Username/Password does not match! Please try again using the correct credentials!"})
            }
        })
        .catch(err => res.status(400).json({ message: "bad-request1", data: "There's a problem with your account! There's a problem with your account! Please contact customer support for more details." }))
    }
})
.catch(err => res.status(400).json({ message: "bad-request1", data: "There's a problem with your account! There's a problem with your account! Please contact customer support for more details." }))
}
}


exports.registerstaffs = async(req, res) => {
    const {username, password} = req.body

    if (username == "" || password == ""){
        return res.status(400).json({ message: "bad-request", data: "Please complete the form first before saving." })
    }

    if (username.length < 5 || username.length > 40){
        return res.status(400).json({message: "failed", data: "Minimum of 5 and maximum of 20 characters only for username! Please try again."})
    }

    const usernameRegex = /^[a-zA-Z0-9]+$/;
    
    if (!usernameRegex.test(username)){
        return res.status(400).json({message: "failed", data: "Please don't use special characters for username! Please try again."})
    }

    if (password.length < 5 || password.length > 20){
        return res.status(400).json({message: "failed", data: "Minimum of 5 and maximum of 20 characters only for password! Please try again."})
    }

    const passwordRegex = /^[a-zA-Z0-9\[\]!@#*]+$/;

    if (!passwordRegex.test(password)){
        return res.status(400).json({message: "failed", data: "Only []!@#* are supported special characters for password! Please try again."})
    }

    const staff = await Staffusers.findOne({username: { $regex: new RegExp('^' + username + '$', 'i') }})
    .then(data => data)
    .catch(err => {

        console.log(`There's a problem searching staff user for ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: "There's a problem registering your account. Please try again." })
    })

    if (staff){
        return res.status(400).json({message: "failed", data: "You already registered this account! Please login if this is yours."})
    }

    const userdata = await Staffusers.create({username: username, password: password.toLowerCase(), webtoken: "", status: "active", auth: "admin"})
    .then(data => data)
    .catch(err => {

        console.log(`There's a problem creating staff user for ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: "There's a problem registering your account. Please try again." })
    })

    
    await StaffUserwallets.create({owner: new mongoose.Types.ObjectId(userdata._id), type: "adminfee", amount: 0})
    .catch(async err => {

        await Staffusers.findOneAndDelete({_id: new mongoose.Types.ObjectId(userdata._id)})

        console.log(`There's a problem creating admin fee wallet for ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: "There's a problem registering your account. Please try again." })
    })

    return res.json({message: "success"})
}

exports.getreferralusername = async (req, res) => {
    const {id} = req.query

    if (!id){
        return res.status(401).json({message: "failed", data: "No referral found! Please don't tamper with the URL."})
    }

    const user = await Users.findOne({_id: new mongoose.Types.ObjectId(id)})
    .then(data => data)
    .catch(err => {

        console.log(`There's a problem searching user for ${id} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: "There's a problem getting referral, please contact support for more details." })
    })

    if (!user){
        console.log(`Referral id does not exist for ${id}`)

        return res.status(400).json({ message: "bad-request", data: "Referral id does not exist, please contact support for more details." })
    }

    return res.json({message: "success", data: user.username})
}

exports.logout = async (req, res) => {
    res.clearCookie('sessionToken', { sameSite: 'None', secure: true })
    return res.json({message: "success"})
}

exports.automaticlogin = async (req, res) => {
    const {auth} = req.user

    return res.json({message: "success", data: {
        auth: auth
    }})
}
