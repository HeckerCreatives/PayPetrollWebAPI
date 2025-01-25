const { default: mongoose } = require("mongoose")
const Inventory = require("../models/Inventory")
const Trainer = require("../models/Trainer")
const { saveinventoryhistory } = require("../utils/inventorytools")
const { walletbalance, sendcommissionunilevel, reducewallet } = require("../utils/walletstools")
const { addanalytics } = require("../utils/analyticstools")
const { DateTimeServerExpiration, DateTimeServer } = require("../utils/datetimetools")
const Inventoryhistory = require("../models/Inventoryhistory")
exports.buytrainer = async (req, res) => {
    const {id, username} = req.user
    const {type, amount } = req.body


    const wallet = await walletbalance("fiatbalance", id)

    if (wallet == "failed"){
        return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    }

    if (wallet == "nodata"){
        return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    }

    if (wallet < amount){
        return res.status(400).json({ message: 'failed', data: `You don't have enough funds to buy this trainer! Please top up first and try again.` })
    }

    const trainer = await Trainer.findOne({ name: type })

    const finalprice = trainer.profit

    if (amount < trainer.min){
        return res.status(400).json({ message: 'failed', data: `The minimum price for ${trainer.name} is ${trainer.min} pesos`})
    }

    if (amount > trainer.max){
        return res.status(400).json({ message: 'failed', data: `The maximum price for ${trainer.name} is ${trainer.max} pesos`})
    }

    const buy = await reducewallet("fiatbalance", amount, id)

    if (buy != "success"){
        return res.status(400).json({ message: 'failed', data: `You don't have enough funds to buy this trainer! Please top up first and try again.` })
    }

    const unilevelrewards = await sendcommissionunilevel(amount, id, trainer.name)

    if (unilevelrewards != "success"){
        return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    }
    

    await Inventory.create({owner: new mongoose.Types.ObjectId(id), type: type, qty: 1, startdate: DateTimeServer(), duration: DateTimeServerExpiration(trainer.duration), rank: trainer.rank, totalaccumulated: 0, dailyaccumulated: 0,  price: amount,})
    .catch(err => {
    
            console.log(`Failed to trainer inventory data for ${username} type: ${type}, error: ${err}`)
    
            return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
        })
    
        
        const inventoryhistory = await saveinventoryhistory(id, trainer.name, trainer.rank, `Buy ${trainer.name}`, amount)
        
        await addanalytics(id, inventoryhistory.data.transactionid, `Buy ${trainer.name}`, `User ${username} bought ${trainer.trainer}`, amount)

    return res.json({message: "success"})
}


exports.getinventory = async (req, res) => {
    const {id, username} = req.user
    const {rank, page, limit} = req.query

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    }

    const trainer = await Inventory.find({owner: id, rank: rank})
    .skip(pageOptions.page * pageOptions.limit)
    .limit(pageOptions.limit)
    .sort({'createdAt': -1})
    .then(data => data)
    .catch(err => {

        console.log(`Failed to get inventory data for ${username}, error: ${err}`)

        return res.status(401).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    const totalPages = await Inventory.countDocuments({owner: id, rank: rank})
    .then(data => data)
    .catch(err => {

        console.log(`Failed to count documents inventory data for ${username}, error: ${err}`)

        return res.status(401).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    const pages = Math.ceil(totalPages / pageOptions.limit)

    const data = {}

    let index = 0

    for (const trainers of trainer) {
        const { _id, type, rank, dailyaccumulated, totalaccumulated, qty, price } = trainers;

        const trainerz = await Trainer.findOne({ name: type });

        if (!trainerz) {
            console.log(`Trainer type ${type} not found for ${username}`);
            continue; // Skip if no trainer details found
        }
        const creaturelimit = (parseInt(price) * trainerz.profit) + parseInt(price);
        const limitperday = creaturelimit / trainerz.duration;

        data[index] = {
            type: type,
            creatureid: _id,
            rank: rank,
            qty: qty,
            totalaccumulated: totalaccumulated,
            dailyaccumulated: dailyaccumulated,
            limittotal: creaturelimit,
            limitdaily: limitperday
        };

        index++;
    }

    // Add total pages to the response
    data["totalPages"] = totalPages;

    console.log(data);

    return res.json({message: "success", data: data})
}



exports.getunclaimedincomeinventory = async (req, res) => {
    const {id, username} = req.user

    const unclaimedincome = await Inventory.aggregate([
        { 
            $match: { 
                owner: new mongoose.Types.ObjectId(id)
            } 
        },
        { 
            $group: { 
                _id: null, 
                totalaccumulated: { $sum: "$totalaccumulated" }
            } 
        }
    ])
    .catch(err => {
        console.log(`There's a problem getting the statistics of total purchase for ${username}. Error ${err}`)

        return res.status(400).json({message: "bad-request", data : "There's a problem getting the statistics of total purchased. Please contact customer support."})
    })

    return res.json({message: "success", data: {
        totalaccumulated: unclaimedincome.length > 0 ? unclaimedincome[0].totalaccumulated : 0
    }})
}
exports.getinventoryhistory = async (req, res) => {
    const {id, username} = req.user
    const {type, page, limit} = req.query

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    }

    const history = await Inventoryhistory.find({
        owner: new mongoose.Types.ObjectId(id),
        type: { $regex: type, $options: "i" } // Case-insensitive regex search
    })
    .skip(pageOptions.page * pageOptions.limit)
    .limit(pageOptions.limit)
    .sort({'createdAt': -1})
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting the inventory history of ${username}. Error: ${err}`)

        return res.status(400).json({message: "bad-request", data: "There's a problem getting the inventory history. Please contact customer support."})
    })

    if (history.length <= 0){
        return res.json({message: "success", data: {
            history: [],
            totalpages: 0
        }})
    }

    const totalPages = await Inventoryhistory.countDocuments({
        owner: new mongoose.Types.ObjectId(id),
        type: { $regex: type, $options: "i" } 
    })
    .then(data => data)
    .catch(err => {

        console.log(`Failed to count documents inventory history data for ${username}, error: ${err}`)

        return res.status(401).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    const pages = Math.ceil(totalPages / pageOptions.limit)

    const data = {
        history: [],
        totalpages: pages
    }

    history.forEach(tempdata => {
        const {createdAt, rank, trainername, type, amount} = tempdata

        data.history.push({
            trainername: trainername,
            rank: rank,
            type: type,
            amount: amount,
            createdAt: createdAt
        })
    })

    return res.json({message: "success", data: data})
}