const mongoose = require('mongoose');

const NFTLimitSchema = new mongoose.Schema(
    {
        nft: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'NFTTrainer',
            index: true, // Automatically creates an index on 'nft'
        },
        limit: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
)

const NFTLimit = mongoose.model('NFTLimit', NFTLimitSchema);
module.exports = NFTLimit;