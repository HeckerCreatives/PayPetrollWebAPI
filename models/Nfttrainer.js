const { default: mongoose } = require("mongoose");


const NFTTrainerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
        },
        price: {
            type: Number,
            default: 0,
        },
        profit: {
            type: Number,
            default: 0.2,
        },
        duration: {
            type: Number,
            default: 7,
        },
        type: {
            type: String
        },
        rank: {
            type: String
        },
        stocks: {
            type: Number,
            default: 0
        },
        limit: {
            type: Number,
            default: 0
        }

    },
    {
        tiimestamps: true,
    }
)

const NFTTrainer = mongoose.model("NFTTrainer", NFTTrainerSchema)
module.exports = NFTTrainer