const { default: mongoose } = require("mongoose")
const Inventory = require("../models/Inventory")
const Trainer = require("../models/Trainer")
const { saveinventoryhistory, getfarm } = require("../utils/inventorytools")
const { walletbalance, sendcommissionunilevel, reducewallet, addwallet } = require("../utils/walletstools")
const { addanalytics } = require("../utils/analyticstools")
const { DateTimeServerExpiration, DateTimeServer, RemainingTime, AddUnixtimeDay } = require("../utils/datetimetools")
const Inventoryhistory = require("../models/Inventoryhistory")
const { addwallethistory } = require("../utils/wallethistorytools")
const Maintenance = require("../models/Maintenance")
const Dailyclaim = require("../models/Dailyclaim")

exports.buytrainer = async (req, res) => {
    const {id, username} = req.user
    const {type, amount } = req.body

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const wallet = await walletbalance("fiatbalance", id)

        if (wallet == "failed" || wallet == "nodata"){
            return res.status(400).json({message: "failed", data: "There's a problem with your account. Please contact customer support for more details"});
        }

        if (wallet < amount){
            return res.status(400).json({message: "failed", data: "You don't have enough funds to buy this trainer! Please top up first and try again."});
        }

        const trainer = await Trainer.findOne({ name: type })

        if (amount < trainer.min){
            return res.status(400).json({message: "failed", data: `The minimum price for ${trainer.name} is ${trainer.min} pesos`});
        }

        if (amount > trainer.max){
            return res.status(400).json({message: "failed", data: `The maximum price for ${trainer.name} is ${trainer.max} pesos`});
        }

        // if (trainer.rank === 'Novice') {
        //     // if (!mongoose.Types.ObjectId.isValid(id)) {
        //     //     return res.status(400).json({message: "failed", data: 'Invalid user ID'});
        //     // }
        
        //     // const finalamount = await Inventory.aggregate([
        //     //     { $match: { owner: new mongoose.Types.ObjectId(id), rank: "Novice" } },
        //     //     { $group: { _id: null, totalAmount: { $sum: "$price" } } }
        //     // ]);
        
        //     // const totalAmount = finalamount.length > 0 ? finalamount[0].totalAmount : 0;
        //     // const amountleft = Math.max(0, 5000 - totalAmount);
        //     // const amountToBuy = Number(amount);
        
        //     // if (amountleft < amountToBuy) {
        //     //     return res.status(400).json({message: "failed", data: `You only have ${amountleft} pesos left to buy a novice trainer.`});
        //     // }
        // } else {
        //     // limit to 2 types of trainer per rank
        //     // const existingTrainers = await Inventory.find({ owner: new mongoose.Types.ObjectId(id), rank: trainer.rank })
        //     // if (existingTrainers.length >= 2) {
        //     //     return res.status(400).json({message: "failed", data: `You can only have a maximum of 2 trainers of rank ${trainer.rank}.`});
        //     // }
        // }

        const buy = await reducewallet("fiatbalance", amount, id)
        if (buy != "success"){
            return res.status(400).json({message: "failed", data: "You don't have enough funds to buy this trainer! Please top up first and try again."});
        }

        const unilevelrewards = await sendcommissionunilevel(amount, id, trainer.name, trainer.rank)
        if (unilevelrewards != "success"){
            return res.status(400).json({message: "failed", data: "There's a problem with your account. Please contact customer support for more details"});
        }

        const totalincome = (trainer.profit * amount) + amount
        
        const b1t1 = await Maintenance.findOne({ type: "b1t1", value: "1" }).session(session);

        const baseInventory = {
            owner: new mongoose.Types.ObjectId(id), 
            type: type,
            startdate: DateTimeServer(), 
            duration: trainer.duration, 
            profit: trainer.profit,
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
        };

        const b1t1income = totalincome - amount

        const b1t1Inventory = {
            owner: new mongoose.Types.ObjectId(id), 
            type: type,
            startdate: DateTimeServer(), 
            duration: trainer.duration, 
            profit: 0,
            expiration: DateTimeServerExpiration(trainer.duration), 
            rank: trainer.rank, 
            totalaccumulated: 0, 
            dailyaccumulated: 0,
            totalincome: b1t1income,
            dailyclaim: 0,  
            price: b1t1income,
            petname: trainer.name,
            petclean: 0,
            petlove: 0,
            petfeed: 0,
        };

        if(b1t1 && b1t1.value === '1' && b1t1.type === 'b1t1'){
            // Create first trainer
            await Inventory.create([baseInventory], { session });
            const inventoryhistory = await saveinventoryhistory(id, trainer.name, trainer.rank, `Buy ${trainer.name}`, amount);
            await addanalytics(id, inventoryhistory.data.transactionid, `Buy ${trainer.name}`, `User ${username} bought ${trainer.name}`, amount);

            // Create second trainer (B1T1)
            await Inventory.create([b1t1Inventory], { session });
            const inventoryhistory1 = await saveinventoryhistory(id, trainer.name, trainer.rank, `Buy ${trainer.name}`, amount);
            await addanalytics(id, inventoryhistory1.data.transactionid, `Buy ${trainer.name}`, `User ${username} bought ${trainer.trainer}`, amount);
        } else {
            await Inventory.create([baseInventory], { session });
            const inventoryhistory = await saveinventoryhistory(id, trainer.name, trainer.rank, `Buy ${trainer.name}`, amount);
            await addanalytics(id, inventoryhistory.data.transactionid, `Buy ${trainer.name}`, `User ${username} bought ${trainer.trainer}`, amount);
        }

        await session.commitTransaction();
        return res.json({message: "success"});

    } catch (error) {
        await session.abortTransaction();
        return res.status(400).json({
            message: 'failed',
            data: error.message || "There's a problem with your account. Please contact customer support for more details"
        });
    } finally {
        session.endSession();
    }
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

    if(!trainer){
        return res.status(400).json({message: "failed", data: "No trainer is selected"})
    }

    if (Number(trainerdb.totalaccumulated) < Number(trainerdb.totalincome)){
        return res.status(400).json({message: "failed", data: "You still didn't reach the limit of this trainer! keep playing and reach the limit in order to claim"})
    }

    // const remainingtime = RemainingTime(parseFloat(trainerdb.startdate), trainerdb.duration)

    // if (remainingtime > 0){
    //     return res.status(400).json({message: "failed", data: "There are still remaining time before claiming! Wait for the timer to complete."})
    // }

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
    await saveinventoryhistory(id, `${trainer.name}`, trainer.rank, `Claim ${trainer.petname}`, trainerdb.totalaccumulated)

    await addanalytics(id, wallethistory.data.transactionid, `gamebalance`, `Player ${username} claim ${trainerdb.totalaccumulated} in Trainer ${trainerdb.type}`, trainerdb.totalaccumulated)

    await Dailyclaim.deleteMany({ owner: new mongoose.Types.ObjectId(id), inventory: new mongoose.Types.ObjectId(trainerid) })
    .catch(err => {
        console.log(`There's a problem getting the deleting Dailyclaim data for ${username} Trainer id: ${trainerid}. Error: ${err}`)

        return res.status(400).json({message: "bad-request", data: "There's a problem getting the deleting Dailyclaim data! Please contact customer support"})
    })
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
        const rankFilter = rank === "Elite" ? { $in: ["Elite", "Ace"] } : rank === "Ace" ? { $in: ["Ace", "Elite"] } : rank;

        const [trainer, totalDocuments] = await Promise.all([
            Inventory.find({ owner: id, rank: rankFilter })
                .skip(pageOptions.page * pageOptions.limit)
                .limit(pageOptions.limit)
                .sort({ 'createdAt': -1 }),
            Inventory.countDocuments({ owner: id, rank: rankFilter })
        ]);

        const pages = Math.ceil(totalDocuments / pageOptions.limit);

        const data = await Promise.all(trainer.map(async (trainers) => {
            const { _id, type, rank, duration, dailyaccumulated, totalaccumulated, qty, price, startdate, profit, totalincome } = trainers; 

            const creaturelimit = (parseInt(price) * profit) + parseInt(price);
            const limitperday = creaturelimit / duration;

            const earnings = getfarm(startdate, AddUnixtimeDay(startdate, duration), creaturelimit);
            const remainingtime = RemainingTime(parseFloat(startdate), duration);

            return {
                type: type,
                trainer: _id,
                rank: rank,
                qty: qty,
                duration: duration,
                totalincome: totalincome,
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
            Inventory.countDocuments({ owner: id })
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

exports.getinventoryhistoryuseradmin = async (req, res) => {
    const {id, username} = req.user
    const {userid, type, page, limit} = req.query

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    }

    const history = await Inventoryhistory.find({ owner: new mongoose.Types.ObjectId(userid), type: { $regex: type, $options: "i" }})    
    .skip(pageOptions.page * pageOptions.limit)
    .limit(pageOptions.limit)
    .sort({'createdAt': -1})
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting the inventory history of ${userid}. Error: ${err}`)

        return res.status(400).json({message: "bad-request", data: "There's a problem getting the inventory history. Please contact customer support."})
    })

    if (history.length <= 0){
        return res.json({message: "success", data: {
            history: [],
            totalpages: 0
        }})
    }

    const totalPages = await Inventoryhistory.countDocuments({owner: new mongoose.Types.ObjectId(userid), type: { $regex: type, $options: "i" }})
    .then(data => data)
    .catch(err => {

        console.log(`Failed to count documents inventory history data for ${userid}, error: ${err}`)

        return res.status(401).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    const pages = Math.ceil(totalPages / pageOptions.limit)

    const data = {
        history: [],
        totalpages: pages
    }

    history.forEach(tempdata => {
        const {createdAt, rank, trainername, amount, type,_id} = tempdata

        data.history.push({
            id: _id,
            trainername: trainername,
            type: type,
            rank: rank,
            amount: amount,
            createdAt: createdAt
        })
    })

    return res.json({message: "success", data: data})
}

exports.maxplayerinventorysuperadmin = async (req, res) => {
    
    const {id, username} = req.user

    const {playerid, petid} = req.body
    
    if (!mongoose.Types.ObjectId.isValid(playerid)) {
        return res.status(400).json({ message: 'Invalid user ID' });
    }

    try {    

    
        const bank = await Inventory.findOne({ owner: new mongoose.Types.ObjectId(playerid), _id: new mongoose.Types.ObjectId(petid) });


        if (!bank) {
            return res.status(400).json({ message: 'failed', data: `There's a problem with the server! Please contact customer support.` });
        }


        if(Number(bank.totalaccumulated).toFixed(2) === Number(bank.totalincome).toFixed(2)){
            return res.status(400).json({ message: 'failed', data: `You already reach the maximum limit for this trainer!` });
        }

        bank.totalaccumulated = bank.totalincome
        bank.duration = 0.0007

        await bank.save();

        return res.status(200).json({ message: "success"});
        
    } catch (error) {
        console.error(error)

        return res.status(400).json({ message: "bad-request", data: "There's a problem with the server! Please contact customer support."});
    }
}

exports.deleteplayerinventorysuperadmin = async (req, res) => {
    const {id, username} = req.user

    const {petid} = req.body
    
    try {    

    
        const bank = await Inventory.findOne({  _id: new mongoose.Types.ObjectId(petid) });

        if (!bank) {
            return res.status(400).json({ message: 'failed', data: `There's a problem with the server! Please contact customer support.` });
        }


        // we should also find the inventory history and delete it we can find it through the createdAt date and the trainer name
        const inventoryhistory = await Inventoryhistory.findOne({ 
            owner: new mongoose.Types.ObjectId(bank.owner),
            createdAt: {
            $gte: new Date(bank.createdAt.getTime() - 10000), // 3 seconds before
            $lte: new Date(bank.createdAt.getTime() + 10000)  // 3 seconds after
            },
            trainername: bank.petname 
        }).catch(err => {
            return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
        })

        if (!inventoryhistory) {
            return res.status(400).json({ message: 'failed', data: `There's a problem with the server! Please contact customer support.` });
        }


        await Inventory.findOneAndDelete({ _id: new mongoose.Types.ObjectId(petid) })
        .then(data => data)
        .catch(err => {
            console.log(`There's a problem getting the trainer data for ${username}. Error: ${err}`)
            
            return res.status(400).json({message: "bad-request", data: "There's a problem getting the trainer data! Please contact customer support"})
        })

        // we should also find the inventory history and delete it we can find it through the createdAt date and the trainer name
        await Inventoryhistory.findOneAndDelete({ 
            owner: new mongoose.Types.ObjectId(bank.owner),
            createdAt: {
            $gte: new Date(bank.createdAt.getTime() - 10000), // 3 seconds before
            $lte: new Date(bank.createdAt.getTime() + 10000)  // 3 seconds after
            },
            trainername: bank.petname 
        }).catch(err => {
            console.log(`Failed to delete inventory history for ${username}, error: ${err}`)
            return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
        })

        return res.status(200).json({ message: "success"});

    } catch (error) {
        console.error(error)

        return res.status(400).json({ message: "bad-request", data: "There's a problem with the server! Please contact customer support."});
    }
}


exports.deleteplayerinventoryhistorysuperadmin = async (req, res) => {

    const {id, username} = req.user

    const {historyid} = req.body

    if (!mongoose.Types.ObjectId.isValid(historyid)) {
        return res.status(400).json({ message: 'Invalid History ID' });
    }

    const history = await Inventoryhistory.findOne({ _id: new mongoose.Types.ObjectId(historyid) })
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting the trainer data for ${username}. Error: ${err}`)
        
        return res.status(400).json({message: "bad-request", data: "There's a problem getting the trainer data! Please contact customer support"})
    })

    if (!history){
        return res.status(400).json({message: "failed", data: "History not found"})
    }

    await Inventory.findOneAndDelete({ 
        owner: new mongoose.Types.ObjectId(history.owner),
        createdAt: {
        $gte: new Date(history.createdAt.getTime() - 10000), // 3 seconds before
        $lte: new Date(history.createdAt.getTime() + 10000)  // 3 seconds after
        },
        rank: history.rank,
        type: history.trainername
    })
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting the trainer data for ${username}. Error: ${err}`)
        
        return res.status(400).json({message: "bad-request", data: "There's a problem getting the trainer data! Please contact customer support"})
    })

    await Inventoryhistory.findOneAndDelete({ _id: new mongoose.Types.ObjectId(historyid) })
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting the trainer data for ${username}. Error: ${err}`)
        
        return res.status(400).json({message: "bad-request", data: "There's a problem getting the trainer data! Please contact customer support"})
    })

    return res.status(200).json({ message: "success"});
}

exports.dailyclaimhistory = async (req, res) => {
    const { id, username } = req.user;
    const { page, limit } = req.query;

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    };

    try {
        const history = await Dailyclaim.find({ owner: new mongoose.Types.ObjectId(id) })
            .populate('inventory')
            .skip(pageOptions.page * pageOptions.limit)
            .limit(pageOptions.limit)
            .sort({ 'createdAt': -1 });

        if (!history || history.length === 0) {
            return res.json({
                message: "success",
                data: {
                    history: [],
                    totalpages: 0
                }
            });
        }

        const totalPages = await Dailyclaim.countDocuments({ owner: new mongoose.Types.ObjectId(id) });
        const pages = Math.ceil(totalPages / pageOptions.limit);

        const data = {
            history: [],
            totalpages: pages
        };

        history.forEach(tempdata => {
            // Get values from Dailyclaim and populated inventory
            const trainername = tempdata.inventory?.petname || tempdata.inventory?.type || "Unknown";
            const rank = tempdata.inventory?.rank || "Unknown";
            const amount = tempdata.amount;
            const createdAt = tempdata.createdAt;

            data.history.push({
                trainername: trainername,
                rank: rank,
                amount: amount,
                createdAt: createdAt
            });
        });

        return res.json({ message: "success", data: data });
    } catch (err) {
        console.log(`There's a problem getting the daily claim history of ${username}. Error: ${err}`);
        return res.status(400).json({
            message: "bad-request",
            data: "There's a problem getting the daily claim history. Please contact customer support."
        });
    }
};

exports.dailyclaimhistorysa = async (req, res) => {
    const { id, username } = req.user;
    const { playerid, page, limit } = req.query;

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    };

    try {
        const history = await Dailyclaim.find({ owner: new mongoose.Types.ObjectId(playerid) })
            .populate('inventory')
            .skip(pageOptions.page * pageOptions.limit)
            .limit(pageOptions.limit)
            .sort({ 'createdAt': -1 });

        if (!history || history.length === 0) {
            return res.json({
                message: "success",
                data: {
                    history: [],
                    totalpages: 0
                }
            });
        }

        const totalPages = await Dailyclaim.countDocuments({ owner: new mongoose.Types.ObjectId(playerid) });
        const pages = Math.ceil(totalPages / pageOptions.limit);

        const data = {
            history: [],
            totalpages: pages
        };

        history.forEach(tempdata => {
            // Get values from Dailyclaim and populated inventory
            const trainername = tempdata.inventory?.petname || tempdata.inventory?.type || "Unknown";
            const rank = tempdata.inventory?.rank || "Unknown";
            const amount = tempdata.amount;
            const createdAt = tempdata.createdAt;

            data.history.push({
                historyid: tempdata._id,
                trainername: trainername,
                rank: rank,
                amount: amount,
                createdAt: createdAt
            });
        });

        return res.json({ message: "success", data: data });
    } catch (err) {
        console.log(`There's a problem getting the daily claim history of ${username}. Error: ${err}`);
        return res.status(400).json({
            message: "bad-request",
            data: "There's a problem getting the daily claim history. Please contact customer support."
        });
    }
};

exports.deletedailyclaimhistorysa = async (req, res) => {
    const { id, username } = req.user;
    const { historyid } = req.body;

    if (!mongoose.Types.ObjectId.isValid(historyid)) {
        return res.status(400).json({ message: 'Invalid History ID' });
    }

    const history = await Dailyclaim.findOne({ _id: new mongoose.Types.ObjectId(historyid) })
        .then(data => data)
        .catch(err => {
            console.log(`There's a problem getting the trainer data for ${username}. Error: ${err}`)

            return res.status(400).json({ message: "bad-request", data: "There's a problem getting the trainer data! Please contact customer support" })
        })

    if (!history) {
        return res.status(400).json({ message: "failed", data: "History not found" })
    }

    const inventory = await Inventory.findOne({ _id: new mongoose.Types.ObjectId(history.inventory) })
        .then(data => data)
        .catch(err => {
            console.log(`There's a problem getting the trainer data for ${username}. Error: ${err}`)

            return res.status(400).json({ message: "bad-request", data: "There's a problem getting the trainer data! Please contact customer support" })
        })

    if (!inventory) {
        return res.status(400).json({ message: "failed", data: "Inventory not found" })
    }

    inventory.totalaccumulated = Number(inventory.totalaccumulated) - Number(history.amount)

    await inventory.save()
        .then(data => data)
        .catch(err => {
            console.log(`There's a problem getting the trainer data for ${username}. Error: ${err}`)

            return res.status(400).json({ message: "bad-request", data: "There's a problem getting the trainer data! Please contact customer support" })
        })
    await Dailyclaim.findOneAndDelete({ _id: new mongoose.Types.ObjectId(historyid) })
        .then(data => data)
        .catch(err => {
            console.log(`There's a problem getting the trainer data for ${username}. Error: ${err}`)

            return res.status(400).json({ message: "bad-request", data: "There's a problem getting the trainer data! Please contact customer support" })
        })

    return res.status(200).json({ message: "success" });
}