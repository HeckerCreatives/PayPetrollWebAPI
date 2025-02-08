const { default: mongoose } = require("mongoose")
const Trainer = require("../models/Trainer")
const Inventoryhistory = require("../models/Inventoryhistory")
const Inventory = require("../models/Inventory")


exports.getTrainers = async(req, res)=> {
    
    const trainers = await Trainer.aggregate([
        {
            $group: {
                _id: "$rank", // Group by the 'rank' field
                trainers: {
                    $push: {
                        id: "$_id",
                        name: "$name",
                        animal: "$animal",
                        rank: "$rank",
                        min: "$min",
                        max: "$max",
                        duration: "$duration",
                        profit: "$profit",
                        b1t1: "$b1t1"
                    }
                }
            }
        },
        {
            $project: {
                _id: 0,           // Exclude the MongoDB default `_id` field
                rank: "$_id",     // Rename `_id` to `rank`
                trainers: 1       // Include the grouped trainers array
            }
        }
    ])

    return res.status(200).json({ message: "success", data: trainers})
}

exports.edittrainer = async (req, res) => {

    const { trainerid, profit, duration, min, max, b1t1 } = req.body

    if(!trainerid || !profit || !duration){
        return res.status(400).json({ message: "failed", data: "Incomplete form data."})
    }

    if (parseFloat(min) > parseFloat(max)) {
        return res.status(400).json({ message: "failed", data: "Min value cannot be greater than Max value." });
    }
    if (parseFloat(min) < 0 || parseFloat(max) < 0 || parseFloat(profit) < 0 || parseFloat(duration) < 0) {
        return res.status(400).json({ message: "failed", data: "Values cannot be negative." });
    }

    if (b1t1 && !/^[01]+$/.test(b1t1)) {
        return res.status(400).json({ message: "failed", data: "b1t1 should only contain '1' and '0'." });
    }

    await Trainer.findOneAndUpdate(
        {
            _id: new mongoose.Types.ObjectId(trainerid)
        },
        {
            $set: {
                profit: parseFloat(profit),
                duration: parseFloat(duration),
                min: parseFloat(min),
                max: parseFloat(max),
                ...(b1t1 && { b1t1 }) // Only update b1t1 if it is provided
            }
        }
    )
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem encountered while updating ${trainerid} mole. Error: ${err}`)
        return res.status(400).json({ message: "bad-request", data: "There's a problem with the server. Please contact customer support for more details."})
    })

    return res.status(200).json({ message: "success" })
}



exports.getusertrainer = async (req, res) => {
    const { id, username } = req.user

    const { type } = req.query


    if (!type) {
        return res.status(400).json({ message: "failed", data: "Incomplete form data." });
    }

    if(type === 'Novice'){
        const finalamount = await Inventory.aggregate([
            { $match: { owner: new mongoose.Types.ObjectId(id), rank: "Novice" } },
            { $group: { _id: null, totalAmount: { $sum: "$price" } } }
        ]);

        const totalAmount = finalamount.length > 0 ? finalamount[0].totalAmount : 0;

        const amountleft = 5000 - totalAmount;

        return res.status(200).json({ message: "success", data: { amountleft: amountleft}})
       
    }
    else if(type === 'Expert'){
        const test1 = await Inventoryhistory.findOne({ owner: new mongoose.Types.ObjectId(id), type: { $regex: /^Claim/ }, rank: "Novice" })

        if(!test1){
            return res.status(400).json({ message: "failed", data: `You need to claim a Novice (1) Trainer first.` });
        }
    } else if (type === 'Ace'){
        const test1 = await Inventoryhistory.findOne({ owner: new mongoose.Types.ObjectId(id), type: { $regex: /^Claim/ }, rank: "Novice" })
        const test2 = await Inventoryhistory.findOne({ owner: new mongoose.Types.ObjectId(id), type: { $regex: /^Claim/ }, rank: "Expert" })

        if(!test1 || !test2){
            return res.status(400).json({ message: "failed", data: `You need to claim a Novice (1) and Expert (1) Trainer first.` });
        }
    } else if (type === 'Ace of Spade'){
        const test1 = await Inventoryhistory.findOne({ owner: new mongoose.Types.ObjectId(id), type: { $regex: /^Claim/ }, rank: "Novice" })
        const test2 = await Inventoryhistory.findOne({ owner: new mongoose.Types.ObjectId(id), type: { $regex: /^Claim/ }, rank: "Expert" })
        const test3 = await Inventoryhistory.findOne({ owner: new mongoose.Types.ObjectId(id), type: { $regex: /^Claim/ }, rank: "Ace" })

        if(!test1 || !test2 || !test3){
            return res.status(400).json({ message: "failed", data: `You need to claim a Novice (1), Expert (1) and Ace (1) Trainer first.` });
        }
    }  else if (type === 'Ace of Heart'){
        const test1 = await Inventoryhistory.findOne({ owner: new mongoose.Types.ObjectId(id), type: { $regex: /^Claim/ }, rank: "Novice" })
        const test2 = await Inventoryhistory.findOne({ owner: new mongoose.Types.ObjectId(id), type: { $regex: /^Claim/ }, rank: "Expert" })
        const test3 = await Inventoryhistory.findOne({ owner: new mongoose.Types.ObjectId(id), type: { $regex: /^Claim/ }, rank: "Ace" })
        const test4 = await Inventoryhistory.findOne({ owner: new mongoose.Types.ObjectId(id), type: { $regex: /^Claim/ }, rank: "Ace of Spade" })

        if(!test1 || !test2 || !test3 || !test4){
            return res.status(400).json({ message: "failed", data: `You need to claim a Novice (1), Expert (1), Ace (1) and Ace of Spade (1) Trainer first.` });
        }
    } else {
        return res.status(400).json({ message: "failed", data: "Invalid type." });
    }


    return res.status(200).json({ message: "success" })
}