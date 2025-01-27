const { default: mongoose } = require("mongoose")
const Payout = require("../models/Payout")
const { checkmaintenance } = require("../utils/maintenancetools")
const Userwallets = require("../models/Userwallets")
const StaffUserwallets = require("../models/Staffuserwallets")

exports.requestpayout = async (req, res) => {
    const {id, username} = req.user
    const {type, payoutvalue, paymentmethod, accountname, accountnumber} = req.body

    const maintenance = await checkmaintenance("payout")

    if (maintenance == "maintenance"){
        return res.status(400).json({ message: "failed", data: "The payout is currently not available. Payout is only available from 12:00pm - 11:59pm Friday PST." })
    }

    else if (maintenance != "success"){
        return res.status(400).json({ message: "failed", data: "There's a problem requesting your payout! Please try again later." })
    }

    const exist = await Payout.find({owner: new mongoose.Types.ObjectId(id), type: type, status: "processing"})
    .then(data => data)

    if (exist.length > 0){
        return res.status(400).json({ message: "failed", data: "There's an existing request! Please wait for it to be processed before requesting another payout." })
    }

    const wallet = await Userwallets.findOne({owner: new mongoose.Types.ObjectId(id), type: type})
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting leaderboard data ${err}`)
        return res.status(400).json({ message: "bad-request", data: "There's a problem with the server! Please contact customer support for more details." })
    })

    if (payoutvalue > wallet.amount){
        return res.status(400).json({ message: "failed", data: "The amount is greater than your wallet balance" })
    }

    await Userwallets.findOneAndUpdate({owner: new mongoose.Types.ObjectId(id), type: type}, {$inc: {amount: -payoutvalue}})
    .catch(err => {
        console.log(`There's a problem deducting payout value for ${username} with value ${payoutvalue}. Error: ${err}`)
        return res.status(400).json({ message: "bad-request", data: "There's a problem with the server! Please contact customer support for more details." })
    })

    await Payout.create({owner: new mongoose.Types.ObjectId(id), status: "processing", value: payoutvalue, type: type, paymentmethod: paymentmethod, accountname: accountname, accountnumber: accountnumber})
    .catch(async err => {

        await Userwallets.findOneAndUpdate({owner: new mongoose.Types.ObjectId(id), type: type}, {$inc: {amount: payoutvalue}})
        .catch(err => {
            console.log(`There's a problem getting leaderboard data ${err}`)
            return res.status(400).json({ message: "bad-request", data: "There's a problem with the server! Please contact customer support for more details." })
        })

        console.log(`There's a problem getting leaderboard data ${err}`)
        return res.status(400).json({ message: "bad-request", data: "There's a problem with the server! Please contact customer support for more details." })
    })

    return res.json({message: "success"})
}


exports.getrequesthistoryplayer = async (req, res) => {
    const {id, username} = req.user
    const {type, page, limit} = req.query

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    }

    const payouthistory = await Payout.find({owner: new mongoose.Types.ObjectId(id), type: type})
    .populate({
        path: "owner processby",
        select: "username -_id"
    })
    .skip(pageOptions.page * pageOptions.limit)
    .limit(pageOptions.limit)
    .sort({'createdAt': -1})
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting leaderboard data ${err}`)
        return res.status(400).json({ message: "bad-request", data: "There's a problem with the server! Please contact customer support for more details." })
    })

    const totalPages = await Payout.countDocuments({owner: new mongoose.Types.ObjectId(id), type: type})
    .then(data => data)
    .catch(err => {

        console.log(`Failed to count documents Payin data for ${username}, error: ${err}`)

        return res.status(401).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    const pages = Math.ceil(totalPages / pageOptions.limit)

    const data = {
        totalPages: pages,
        history: []
    }

    payouthistory.forEach(valuedata => {
        const {owner, processby, status, value, type, createdAt} = valuedata

        data.history.push({
            date: createdAt,
            grossamount: value,
            withdrawalfee: value * 0.10,
            netammount: value - (value * 0.10),
            status: status == "processing" ? "In review" : status
        })
    })

    return res.json({message: "success", data: data})
}


exports.processpayout = async (req, res) => {
    const {id, username} = req.user
    const {payoutid, status} = req.body

    let payoutvalue = 0
    let playerid = ""
    let wallettype = ""

    const payoutdata = await Payout.findOne({_id: new mongoose.Types.ObjectId(payoutid)})
    .then(data => data)
    .catch(err => {

        console.log(`Failed to get Payout data for ${username}, error: ${err}`)

        return res.status(401).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    if (payoutdata.status != "processing"){
        return res.status(401).json({ message: 'failed', data: `You already processed this payout` })
    }

    await Payout.findOneAndUpdate({_id: new mongoose.Types.ObjectId(payoutid)}, {status: status, processby: new mongoose.Types.ObjectId(id)}, {new: true})
    .then(data => {
        payoutvalue = data.value
        playerid = data.owner._id
        wallettype = data.type
    })
    .catch(err => {

        console.log(`Failed to count documents Payin data for ${username}, error: ${err}`)

        return res.status(401).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    if (status == "reject"){
        await Userwallets.findOneAndUpdate({owner: new mongoose.Types.ObjectId(playerid), type: wallettype}, {$inc: {amount: payoutvalue}})
        .catch(err => {

            console.log(`Failed to process Payout data for ${username}, player: ${playerid}, payinid: ${payinid} error: ${err}`)
    
            return res.status(401).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
        })
    }
    else{

        const adminfee = payoutvalue * 0.1

        await StaffUserwallets.findOneAndUpdate({owner: new mongoose.Types.ObjectId(id)}, {$inc: {amount: adminfee}})

        const analyticsadd = await addanalytics(playerid, "", `payout${wallettype}`, `Payout to user ${playerid} with a value of ${payoutvalue} and admin fee of ${adminfee} processed by ${username}`, payoutvalue)

        if (analyticsadd != "success"){
            return res.status(401).json({ message: 'failed', data: `There's a problem saving payin in analytics history. Please contact customer support for more details` })
        }
    }

    return res.json({message: "success"})
}

exports.deletepayout = async (req, res) => {
    const {id, username} = req.user
    const {payoutid} = req.body

    let payoutvalue = 0

    const payoutdata = await Payout.findOne({_id: new mongoose.Types.ObjectId(payoutid)})
    .then(data => data)
    .catch(err => {

        console.log(`Failed to get Payout data for ${payoutid}, error: ${err}`)

        return res.status(401).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    if (!payoutdata){
        return res.status(400).json({message: "failed", data: "Please select a valid payout request!"})
    }

    await Payout.findOneAndDelete({_id: new mongoose.Types.ObjectId(payoutid)})
    .catch(err => {

        console.log(`Failed to delete Payout data for ${payoutid}, error: ${err}`)

        return res.status(401).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    console.log(`Payout request id: ${payoutdata._id}  owner: ${payoutdata.owner}  type: ${payoutdata.type}  amount: ${payoutdata.value}`)

    await Userwallets.findOneAndUpdate({owner: new mongoose.Types.ObjectId(payoutdata.owner), type: payoutdata.type}, {$inc: {amount: payoutdata.value}})
    .catch(err => {

        console.log(`Failed to update userwallet data for ${payoutdata.owner} with value ${payoutdata.value}, error: ${err}`)

        return res.status(401).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    return res.json({message: "success"})
}