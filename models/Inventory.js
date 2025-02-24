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
            index: true,
        },
        profit: {
            type: Number,
            index: true,
        },
        petname: {
            type: String,
            index: true,
        },
        petclean: {
            type: Number,
            index: true,
        },
        petlove: {
            type: Number,
            index: true,
        },
        petfeed: {
            type: Number,
            index: true,
        },
        dailyclaim: {
            type: Number,
            index: true
        },
        totalincome: {
            type: Number,
            index: true
        },
        totalaccumulated: {
            type: Number
        },
        dailyaccumulated: {
            type: Number
        },
        startdate: {
            type: String,
        },
        duration: {
            type: Number
        },
    },
    {
        timestamps: true
    }
)

const Inventory = mongoose.model("Inventory", inventoryShema)
module.exports = Inventory