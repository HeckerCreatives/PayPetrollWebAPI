const { default: mongoose } = require("mongoose")
const Userwallets = require("../models/Userwallets")
const Wallethistory = require("../models/Wallethistory")
const Analytics = require("../models/Analytics")

exports.playerwallets = async (req, res) => {
    const { id } = req.user

    const wallets = await Userwallets.find({owner: new mongoose.Types.ObjectId(id)})
    .then(data => data)
    .catch(err => {

        console.log(`Failed to get dashboard wallet data for ${data.owner}, error: ${err}`)

        return res.status(401).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    const data = {}

    wallets.forEach(datawallet => {
        const {type, amount} = datawallet

        data[type] = amount
    })

    return res.json({message: "success", data: data})
}

exports.getplayerwalletforadmin = async (req, res) => {
    const {id, username} = req.user
    const {playerid} = req.query

    const playerwallet = await Userwallets.find({owner: new mongoose.Types.ObjectId(playerid)})
    .then(data => data)
    .catch(err => {

        console.log(`There's a problem getting user wallet for ${username}, player: ${playerid}, Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: "There's a problem getting your user details. Please contact customer support." })
    })

    const data = {
        userwallets: []
    }

    playerwallet.forEach(value => {
        const {type, amount} = value

        data.userwallets.push({
            type: type,
            amount: amount
        })
    })

    return res.json({message: "success", data: data})
}


exports.edituserwalletforadmin = async (req, res) => {
    const { id, username } = req.user

    const { playerid, wallettype, amount } = req.body

    // wallettypes are unilevelwallet, directwallet, fiatbalance and gamebalance
    if (!playerid || !wallettype || !amount) {
        return res.status(400).json({ message: "failed", data: "Incomplete form data." });
    }

    if (parseFloat(amount) < 0) {
        return res.status(400).json({ message: "failed", data: "Amount cannot be negative." });
    }

    const totalHistory = await Wallethistory.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(ownerId), type: wallettype } },
        { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
    ]);

    // negate the previous total amount
    await Wallethistory.create({
        owner: wallet.owner,
        type: wallettype,
        amount: -totalHistory[0].totalAmount,
        from: new mongoose.Types.ObjectId(process.env.PAYPETROLLS_ID),
     })
     .then(data => data)
     .catch(err => {
        console.log(`There's a problem encountered while creating ${playerid} wallet history. Error: ${err}`)
        return res.status(400).json({ message: "bad-request", data: "There's a problem with the server. Please contact customer support for more details." })
     })
     
     // add the new amount to the history
     await Wallethistory.create({
         owner: wallet.owner,
         type: wallettype,
         amount: parseFloat(amount),
         from: new mongoose.Types.ObjectId(process.env.PAYPETROLLS_ID),
        })
        .then(data => data)
        .catch(err => {
            console.log(`There's a problem encountered while creating ${playerid} wallet history. Error: ${err}`)
            return res.status(400).json({ message: "bad-request", data: "There's a problem with the server. Please contact customer support for more details." })
        })
        
        const totalAnalytics = await Analytics.aggregate([
            { $match: { owner: new mongoose.Types.ObjectId(ownerId), type: wallettype } },
            { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
        ]);
    
        // negate the previous total amount
        await Analytics.create({
            owner: wallet.owner,
            type: wallettype,
            amount: -totalAnalytics[0].totalAmount,
            from: new mongoose.Types.ObjectId(process.env.PAYPETROLLS_ID),
         })
         .then(data => data)
         .catch(err => {
            console.log(`There's a problem encountered while creating ${playerid} wallet history. Error: ${err}`)
            return res.status(400).json({ message: "bad-request", data: "There's a problem with the server. Please contact customer support for more details." })
         })

         // add the new amount to the analytics
         await Analytics.create({
            owner: wallet.owner,
            type: wallettype,
            amount: parseFloat(amount),
            from: new mongoose.Types.ObjectId(process.env.PAYPETROLLS_ID),
         })
         .then(data => data)
         .catch(err => {
            console.log(`There's a problem encountered while creating ${playerid} wallet history. Error: ${err}`)
            return res.status(400).json({ message: "bad-request", data: "There's a problem with the server. Please contact customer support for more details." })
         })


         await Userwallets.findOneAndUpdate(
        {
            owner: new mongoose.Types.ObjectId(playerid),
            type: wallettype
        },
        {
            $set: {
                amount: parseFloat(amount)
            }
        }
    )
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem encountered while updating ${playerid} wallet. Error: ${err}`)
        return res.status(400).json({ message: "bad-request", data: "There's a problem with the server. Please contact customer support for more details." })
    })


    return res.status(200).json({ message: "success" })
    
}

