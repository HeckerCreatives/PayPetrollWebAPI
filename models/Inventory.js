const mongoose = require("mongoose");

const inventoryShema = new mongoose.Schema(
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
        price: {
            type: Number,
            index: true
        },
        qty: {
            type: Number
        },
        totalaccumulated: {
            type: Number
        },
        dailyaccumulated: {
            type: Number
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

const Inventory = mongoose.model("Inventory", inventoryShema)
module.exports = Inventory