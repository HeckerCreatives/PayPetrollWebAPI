const { default: mongoose } = require("mongoose")
const Inventory = require("../models/Inventory")
const Trainer = require("../models/Trainer")
const { saveinventoryhistory, getfarm } = require("../utils/inventorytools")
const { walletbalance, sendcommissionunilevel, reducewallet, addwallet } = require("../utils/walletstools")
const { addanalytics } = require("../utils/analyticstools")
const { DateTimeServerExpiration, DateTimeServer, RemainingTime, AddUnixtimeDay } = require("../utils/datetimetools")
const Inventoryhistory = require("../models/Inventoryhistory")
const { addwallethistory } = require("../utils/wallethistorytools")

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

    const unilevelrewards = await sendcommissionunilevel(amount, id, trainer.name, trainer.rank)

    if (unilevelrewards != "success"){
        return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    }

    const totalincome = (trainer.profit * amount) + amount
    

    await Inventory.create({
        owner: new mongoose.Types.ObjectId(id), 
        type: type,
        startdate: DateTimeServer(), 
        duration: trainer.duration, 
        expiration: DateTimeServerExpiration(trainer.duration), 
        rank: trainer.rank, 
        totalaccumulated: 0, 
        dailyaccumulated: 0,
        totalincome: totalincome,
        dailyclaim: 0,  
        price: amount,
        petname: trainer.name,
        petclean: 0,
        petlove: 0,
        petfeed: 0,
    })
    .catch(err => {
    
            console.log(`Failed to trainer inventory data for ${username} type: ${type}, error: ${err}`)
    
            return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
        })
    
        
        const inventoryhistory = await saveinventoryhistory(id, trainer.name, trainer.rank, `Buy ${trainer.name}`, amount)
        
        await addanalytics(id, inventoryhistory.data.transactionid, `Buy ${trainer.name}`, `User ${username} bought ${trainer.trainer}`, amount)

    return res.json({message: "success"})
}

exports.claimtotalincome = async (req, res) => {
    const {id, username} = req.user
    const {trainerid} = req.body

    if (!trainerid || trainerid == ""){
        return res.status(400).json({message: "failed", data: "No trainer is selected"})
    }

    const trainerdb = await Inventory.findOne({_id: new mongoose.Types.ObjectId(trainerid)})
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting the trainer data for ${username}. Error: ${err}`)
        
        return res.status(400).json({message: "bad-request", data: "There's a problem getting the trainer data! Please contact customer support"})
    })

    if (!trainerdb){
        return res.status(400).json({message: "failed", data: "No trainer is selected"})
    }

    const trainer = await Trainer.findOne({ name: trainerdb.type, rank: trainerdb.rank})

    const templimit = (trainer.amount * trainer.percentage) + trainer.amount

    if (Math.round(trainerdb.totalaccumulated) < templimit){
        return res.status(400).json({message: "failed", data: "You still didn't reach the limit of this trainer! keep playing and reach the limit in order to claim"})
    }
    const remainingtime = RemainingTime(parseFloat(trainerdb.startdate), trainerdb.duration)

    if (remainingtime > 0){
        return res.status(400).json({message: "failed", data: "There are still remaining time before claiming! Wait for the timer to complete."})
    }

    await addwallet("gamebalance", trainerdb.totalaccumulated, id)

    await Inventory.findOneAndDelete({_id: new mongoose.Types.ObjectId(trainerid)})
    .catch(async err => {
        console.log(`There's a problem getting the deleting Trainer data for ${username} Trainer id: ${trainerid}. Error: ${err}`)

        await reducewallet("gamebalance", trainerdb.totalaccumulated, id)
        
        return res.status(400).json({message: "bad-request", data: "There's a problem getting the finishing Trainer data! Please contact customer support"})
    })

    const wallethistory = await addwallethistory(id, "gamebalance", trainerdb.totalaccumulated, process.env.PAYPETROLLS_ID, trainer.name, trainer.rank)

    if (wallethistory.message != "success"){
        return res.status(400).json({message: "bad-request", data: "There's a problem processing your data. Please contact customer support"})
    }
    await saveinventoryhistory(id, `${trainer.name}`, trainer.rank, `Claim ${trainer.name}`, trainerdb.totalaccumulated)

    await addanalytics(id, wallethistory.data.transactionid, `gamebalance`, `Player ${username} claim ${trainerdb.totalaccumulated} in Trainer ${trainerdb.type}`, trainerdb.totalaccumulated)

    return res.json({message: "success"})
}

exports.gettotalpurchased = async (req, res) => {
    const {id, username} = req.user

    const finaldata = {
        totalpurchased: 0
    }

    const statisticInventoryHistory = await Inventoryhistory.aggregate([
        { 
            $match: { 
                owner: new mongoose.Types.ObjectId(id), 
                type: { $regex: "^Buy", $options: "i" }
            } 
        },
        { 
            $group: { 
                _id: null, 
                totalAmount: { $sum: "$amount" } 
            } 
        }
    ])
    .catch(err => {
        console.log(`There's a problem getting the statistics of total purchase for ${username}. Error ${err}`)

        return res.status(400).json({message: "bad-request", data : "There's a problem getting the statistics of total purchased. Please contact customer support."})
    })

    if (statisticInventoryHistory.length > 0) {
        finaldata.totalpurchased = statisticInventoryHistory[0].totalAmount;
    }

    return res.json({message: "success", data: finaldata})
}

exports.getinventory = async (req, res) => {
    const { id, username } = req.user;
    const { rank, page, limit } = req.query;

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    };

    try {
        const [trainer, totalDocuments] = await Promise.all([
            Inventory.find({ owner: id, rank: rank })
                .skip(pageOptions.page * pageOptions.limit)
                .limit(pageOptions.limit)
                .sort({ 'createdAt': -1 }),
            Inventory.countDocuments({ owner: id, rank: rank })
        ]);

        const pages = Math.ceil(totalDocuments / pageOptions.limit);

        const data = await Promise.all(trainer.map(async (trainers) => {
            const { _id, type, rank, duration, dailyaccumulated, totalaccumulated, qty, price, startdate } = trainers;

            const trainerz = await Trainer.findOne({ name: type });

            if (!trainerz) {
                console.log(`Trainer type ${type} not found for ${username}`);
                return null; // Skip if no trainer details found
            }

            const creaturelimit = (parseInt(price) * trainerz.profit) + parseInt(price);
            const limitperday = creaturelimit / trainerz.duration;

            const earnings = getfarm(startdate, AddUnixtimeDay(startdate, duration), creaturelimit);
            const remainingtime = RemainingTime(parseFloat(startdate), duration);

            return {
                type: type,
                trainer: _id,
                rank: rank,
                qty: qty,
                duration: duration,
                totalaccumulated: totalaccumulated,
                dailyaccumulated: dailyaccumulated,
                limittotal: creaturelimit,
                limitdaily: limitperday,
                earnings: earnings,
                remainingtime: remainingtime
            };
        }));

        return res.json({ message: "success", data: data.filter(item => item !== null), totalpages: pages });
    } catch (err) {
        console.log(`Failed to get inventory data for ${username}, error: ${err}`);
        return res.status(401).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` });
    }
};
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

exports.getplayerinventoryforadmin = async (req, res) => {
    const {id, username} = req.user
    const {playerid, page, limit} = req.query

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    }

    try {
        const [trainer, totalDocuments] = await Promise.all([
            Inventory.find({ owner: new mongoose.Types.ObjectId(playerid) })
                .skip(pageOptions.page * pageOptions.limit)
                .limit(pageOptions.limit)
                .sort({ 'createdAt': -1 }),
            Inventory.countDocuments({ owner: id, rank: rank })
        ]);

        const pages = Math.ceil(totalDocuments / pageOptions.limit);

        const data = await Promise.all(trainer.map(async (trainers) => {
            const { _id, type, rank, duration, dailyaccumulated, totalaccumulated, qty, price, startdate } = trainers;

            const trainerz = await Trainer.findOne({ name: type });

            if (!trainerz) {
                console.log(`Trainer type ${type} not found for ${username}`);
                return null; // Skip if no trainer details found
            }

            const creaturelimit = (parseInt(price) * trainerz.profit) + parseInt(price);
            const limitperday = creaturelimit / trainerz.duration;

            const earnings = getfarm(startdate, AddUnixtimeDay(startdate, duration), creaturelimit);
            const remainingtime = RemainingTime(parseFloat(startdate), duration);

            return {
                type: type,
                trainer: _id,
                rank: rank,
                qty: qty,
                duration: duration,
                totalaccumulated: totalaccumulated,
                dailyaccumulated: dailyaccumulated,
                limittotal: creaturelimit,
                limitdaily: limitperday,
                earnings: earnings,
                remainingtime: remainingtime
            };
        }));

        return res.json({ message: "success", data: data.filter(item => item !== null), totalpages: pages });
    } catch (err) {
        console.log(`Failed to get inventory data for ${username}, error: ${err}`);
        return res.status(401).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` });
    }
}