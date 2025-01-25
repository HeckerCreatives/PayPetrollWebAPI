const { default: mongoose } = require("mongoose")
const Payout = require("../models/Payout")

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