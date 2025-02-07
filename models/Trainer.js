const { default: mongoose } = require("mongoose");


const TrainerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
        },
        min: {
            type: Number,
        },
        max: {
            type: Number,
        },
        profit: {
            type: Number,
            default: 0.2,
        },
        duration: {
            type: Number,
            default: 7,
        },
        animal: {
            type: String
        },
        rank: {
            type: String
        },
        b1t1: {
            type: String
        }
    },
    {
        tiimestamps: true,
    }
)

const Trainer = mongoose.model("Trainer", TrainerSchema)
module.exports = Trainer