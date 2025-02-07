const { default: mongoose } = require("mongoose")
const Trainer = require("../models/Trainer")


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
