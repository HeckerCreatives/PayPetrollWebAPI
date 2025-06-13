const mongoose = require("mongoose");

const NFTInventoryShema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users",
            index: true // Automatically creates an index on 'amount'
        },
        type: {
            type: String,
            index: true // Automatically creates an index on 'amount'
        },
        rank: {
            type: String,
            index: true // Automatically creates an index on 'amount'
        },
        petname: {
            type: String,
            index: true
        },
        price: {
            type: Number
        },
        profit: {
            type: Number,
            index: true // Automatically creates an index on 'amount'
        },
        duration: {
            type: Number
        },
        startdate: {
            type: String,
            index: true // Automatically creates an index on 'amount'
        }
    },
    {
        timestamps: true
    }
)

const NFTInventory = mongoose.model("NFTInventory", NFTInventoryShema)
module.exports = NFTInventory