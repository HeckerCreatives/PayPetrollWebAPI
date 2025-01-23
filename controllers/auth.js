
//  Import all mandatory schemas and delete this if necessary
const Users = require("../models/Users")
const Userdetails = require("../models/Userdetails")
const Staffusers = require("../models/Staffusers")

const fs = require('fs')

const bcrypt = require('bcrypt');
const jsonwebtokenPromisified = require('jsonwebtoken-promisified');
const path = require("path");

const privateKey = fs.readFileSync(path.resolve(__dirname, "../keys/private-key.pem"), 'utf-8');
const { default: mongoose } = require("mongoose");
const Userwallets = require("../models/Userwallets");

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

    const passwordRegex = /^[a-zA-Z0-9\[\]!@#*]+$/;

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

    const searchreferral = await Users.findOne({_id: new mongoose.Types.ObjectId(referral)})
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem searching referral for ${username} referralid: ${referral} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: "Referral does not exist! Please don't tamper with the url." })
    })

    if (!searchreferral){
        console.log(`referral id not exist for ${username} referralid: ${referral}`)

        return res.status(400).json({ message: "bad-request", data: "Referral does not exist! Please don't tamper with the url." })
    }

    const user = await Users.findOne({username: { $regex: new RegExp('^' + username + '$', 'i') }})
    .then(data => data)
    .catch(err => {

        console.log(`There's a problem searching user for ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: "There's a problem registering your account. Please try again." })
    })

    if (user){
        return res.status(400).json({message: "failed", data: "You already registered this account! Please login if this is yours."})
    }

    const player = await Users.create({username: username, password: password.toLowerCase(), referral: new mongoose.Types.ObjectId(referral), gametoken: "", webtoken: "", bandate: "none", banreason: "", status: "active"})
    .catch(err => {

        console.log(`There's a problem creating user for ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: "There's a problem registering your account. Please try again." })
    })


    await Userdetails.create({owner: new mongoose.Types.ObjectId(player._id),  phonenumber: phonenumber, firstname: "", lastname: "", address: "", city: "", country: "", postalcode: "", profilepicture: ""})
    .catch(async err => {

        await Users.findOneAndDelete({_id: new mongoose.Types.ObjectId(player._id)})


        console.log(`There's a problem creating user details for ${player._id} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: "There's a problem registering your account. Please try again." })
    })

    const wallets = ["fiatbalance", "gamebalance", "commissionbalance"]

    wallets.forEach(async (data) => {
        await Userwallets.create({owner: new mongoose.Types.ObjectId(player._id), type: data, amount: 0})
        .catch(async err => {

            await Users.findOneAndDelete({_id: new mongoose.Types.ObjectId(player._id)})


            await Userdetails.findOneAndDelete({_id: new mongoose.Types.ObjectId(player._id)})

            console.log(`There's a problem creating user wallet for ${player._id} with type ${data} Error: ${err}`)

            return res.status(400).json({ message: "bad-request", data: "There's a problem registering your account. Please try again." })
        })
    })


    return res.json({message: "success"})
}


exports.authlogin = async(req, res) => {
    const { username, password } = req.query;

    Users.findOne({ username: { $regex: new RegExp('^' + username + '$', 'i') } })
    .then(async user => {
        if (user && (await user.matchPassword(password))){
            if (user.status != "active"){
                return res.status(401).json({ message: 'failed', data: `Your account had been ${user.status}! Please contact support for more details.` });
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
                        return res.status(401).json({ message: 'failed', data: `Your account had been ${staffuser.status}! Please contact support for more details.` });
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
                    .catch(err => res.status(400).json({ message: "bad-request2", data: "There's a problem with your account! There's a problem with your account! Please contact customer support for more details."  + err }))
                }
                else{
                    return res.json({message: "failed", data: "Username/Password does not match! Please try again using the correct credentials!"})
                }
            })
            .catch(err => res.status(400).json({ message: "bad-request1", data: "There's a problem with your account! There's a problem with your account! Please contact customer support for more details." }))
        }
    })
    .catch(err => res.status(400).json({ message: "bad-request1", data: "There's a problem with your account! There's a problem with your account! Please contact customer support for more details." }))
}

exports.logout = async (req, res) => {
    res.clearCookie('sessionToken', { path: '/' })
    return res.json({message: "success"})
}