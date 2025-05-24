const mongoose = require('mongoose');

const dailyclaimSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        index: true // Automatically creates an index on 'amount'
    },
    inventory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inventory',
        index: true // Automatically creates an index on 'amount'
    },
    amount: {
        type: Number,
        index: true // Automatically creates an index on 'amount'
    },
    date: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const Dailyclaim = mongoose.model('Dailyclaim', dailyclaimSchema);
module.exports = Dailyclaim;
