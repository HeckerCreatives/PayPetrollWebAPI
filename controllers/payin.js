const { default: mongoose } = require("mongoose")
const Payin = require("../models/Payin")
const { addwallethistory } = require("../utils/wallethistorytools")
const { addanalytics } = require("../utils/analyticstools")


exports.processpayin = async (req, res) => {
    const {id, username} = req.user
    const {payinid, status} = req.body

    let payinvalue = 0
    let playerid = ""

    const payindata = await Payin.findOne({_id: new mongoose.Types.ObjectId(payinid)})
    .then(data => data)
    .catch(err => {

        console.log(`Failed to get Payin data for ${username}, error: ${err}`)

        return res.status(401).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    if (payindata.status != "processing"){
        return res.status(401).json({ message: 'failed', data: `You already processed this payin` })
    }

    await Payin.findOneAndUpdate({_id: new mongoose.Types.ObjectId(payinid)}, {status: status, processby: new mongoose.Types.ObjectId(id)})
    .then(data => {
        payinvalue = data.value
        playerid = data.owner._id
    })
    .catch(err => {

        console.log(`Failed to count documents Payin data for ${username}, error: ${err}`)

        return res.status(401).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    if (status == "done"){
        await Userwallets.findOneAndUpdate({owner: new mongoose.Types.ObjectId(playerid), type: "fiatbalance"}, {$inc: {amount: payinvalue}})
        .catch(err => {

            console.log(`Failed to process Payin data for ${username}, player: ${playerid}, payinid: ${payinid} error: ${err}`)
    
            return res.status(401).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
        })

        const wallethistoryadd = await addwallethistory(playerid, "fiatbalance", payinvalue, id, "", "")

        if (wallethistoryadd.message != "success"){
            return res.status(401).json({ message: 'failed', data: `There's a problem saving payin in wallet history. Please contact customer support for more details` })
        }

        const analyticsadd = await addanalytics(playerid, wallethistoryadd.data.transactionid, wallethistoryadd.data.transactionid, "payinfiatbalance", `Add balance to user ${playerid} with a value of ${payinvalue} processed by ${username}`, payinvalue)

        if (analyticsadd != "success"){
            return res.status(401).json({ message: 'failed', data: `There's a problem saving payin in analytics history. Please contact customer support for more details` })
        }
    }

    return res.json({message: "success"})
}

exports.requestpayin = async (req, res) => {
    const {id, username} = req.user
    const {payinvalue} = req.body

    await Payin.create({owner: new mongoose.Types.ObjectId(id), value: payinvalue, status: "processing"})
    .catch(err => {

        console.log(`Failed to create Payin data for ${username}, error: ${err}`)

        return res.status(401).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })
    
    return res.json({message: "success"})
}

exports.getpayinhistoryplayer = async (req, res) => {
    const {id, username} = req.user
    const {page, limit} = req.query

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    }

    const payinhistory = await Payin.find({owner: new mongoose.Types.ObjectId(id)})
    .populate({
        path: "owner processby",
        select: "username -_id"
    })
    .skip(pageOptions.page * pageOptions.limit)
    .limit(pageOptions.limit)
    .sort({'createdAt': -1})
    .then(data => data)
    .catch(err => {

        console.log(`Failed to get payin list data for ${username}, error: ${err}`)

        return res.status(401).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    const totalPages = await Payin.countDocuments({owner: new mongoose.Types.ObjectId(id)})
    .then(data => data)
    .catch(err => {

        console.log(`Failed to count documents Payin data for ${username}, error: ${err}`)

        return res.status(401).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    const pages = Math.ceil(totalPages / pageOptions.limit)

    const data = {
        payinhistory: [],
        totalPages: pages
    }
    
    payinhistory.forEach(valuedata => {
        const {owner, processby, status, value, createdAt} = valuedata

        data.payinhistory.push({
            owner: owner.username,
            processby: processby != null ? processby.username : "",
            status: status,
            value: value,
            createdAt: createdAt
        })
    })

    return res.json({message: "success", data: data})
}