const { default: mongoose } = require("mongoose");
const { nftdata } = require("../initialization/data");
const NFTTrainer = require("../models/Nfttrainer");


exports.getNfttrainer = async (req, res) => {

    const { id, username } = req.user;

    let data = await NFTTrainer.find()
        .then(data => data)
        .catch(err => {
            console.error("Error fetching NFT trainers:", err);
            return res.status(500).json({ message: "failed", data: "Internal server error." });
        });

    if (!data || data.length === 0) {
         data = await NFTTrainer.insertMany(nftdata)
    }

    // format data 

    const formattedData = data.map(item => ({
        id: item._id,
        name: item.name,
        price: item.price,
        profit: item.profit,
        duration: item.duration,
        type: item.type,
        rank: item.rank,
        stocks: item.stocks,
        limit: item.limit || 0,
        isActive: item.isActive || true
    }));

    return res.status(200).json({ message: "success", data: formattedData });
}

exports.editNfttrainer = async (req, res) => {
    const { nftid, name, profit, duration, price, type, rank, stocks, limit, isActive } = req.body;

    const updateData = {};

    if (name) updateData.name = name;
    if (type) updateData.type = type;
    if (rank) updateData.rank = rank;
    if (stocks) updateData.stocks = stocks;
    if (profit) updateData.profit = parseFloat(profit);
    if (duration) updateData.duration = parseFloat(duration);
    if (price) updateData.price = parseFloat(price);
    if (limit) updateData.limit = parseFloat(limit); 
    if (isActive !== undefined) updateData.isActive = isActive;


    const numericValues = [price, profit, duration].filter(val => val !== undefined);
    if (numericValues.some(val => parseFloat(val) < 0)) {
        return res.status(400).json({ message: "failed", data: "Values cannot be negative." });
    }

    await NFTTrainer.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(nftid) },
        { $set: updateData }
    )
        .then(data => data)
        .catch(err => {
            console.error(`Error updating NFT trainer ${nftid}:`, err);
            return res.status(500).json({ message: "bad-request", data: "Internal server error." });
        });

    return res.status(200).json({ message: "success" });
}

