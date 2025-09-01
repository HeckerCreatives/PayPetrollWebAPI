const { default: mongoose } = require("mongoose");
const { nftdata, newnftdata, newnewnftdata, anothernewnewnftdata } = require("../initialization/data");
const NFTTrainer = require("../models/Nfttrainer");
const NFTInventory = require("../models/Nftinventory");
const Inventoryhistory = require("../models/Inventoryhistory");


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

    const newnfts = ["Spider Puppy", "Black Hachi", "Shiba Widow", "Doctor Puppy", "Captain Inu"]
    const newdata = data.filter(item => newnfts.includes(item.name));
    if (newdata.length === 0) {
        for (const nft of newnftdata) {
            await NFTTrainer.findOneAndUpdate(
                { _id: nft._id },
                { $set: nft },
                { upsert: true, new: true }
            );
        }
        data = await NFTTrainer.find();
    }

    const newnewnfts = ["Shibarine", "DOG POOL", "Shibaclops", "Hachi Fury", "Magne Dog"]
    const newnewdata = data.filter(item => newnewnfts.includes(item.name));

    if (newnewdata.length === 0) {
        for (const nft of newnewnftdata) {
            await NFTTrainer.findOneAndUpdate(
                { _id: nft._id },
                { $set: nft },
                { upsert: true, new: true }
            );
        }
        data = await NFTTrainer.find();
    }

    const anothernewnewnfts = ["ANT DOG", "LOCHI", "Hachi Eye", "Droog", "Dogmora"]
    const anothernewnewdata = data.filter(item => anothernewnewnfts.includes(item.name));

    if (anothernewnewdata.length === 0) {
        for (const nft of anothernewnewnftdata) {
            await NFTTrainer.findOneAndUpdate(
                { _id: nft._id },
                { $set: nft },
                { upsert: true, new: true }
            );
        }
        data = await NFTTrainer.find();
    }


    let existingtrianers = await NFTInventory.find({ owner: new mongoose.Types.ObjectId(id) })
        .then(data => data)
        .catch(err => {
            console.error("Error fetching NFT inventory:", err);
            return res.status(500).json({ message: "failed", data: "Internal server error." });
        });
    // format data 

    let totalnftpurchasedcount = await Inventoryhistory.find({ rank: "NFT", type: { $regex: /^Buy/i } });

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
        isActive: item.isActive !== undefined ? item.isActive : false, 
        isPurchased: existingtrianers.some(trainer => trainer.petname === item.name && trainer.rank === item.rank) || false,
        purchasedCount: existingtrianers.filter(trainer => trainer.petname === item.name && trainer.rank === item.rank).length || 0,
        timesbought: totalnftpurchasedcount.filter(trainer => trainer.trainername === item.name && trainer.rank === item.rank).length || 0,
    }));

    return res.status(200).json({ message: "success", data: formattedData });
}


exports.editNfttrainer = async (req, res) => {
    const { nftid, name, profit, duration, price, type, rank, stocks, limit, isActive } = req.body;

    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (rank !== undefined) updateData.rank = rank;
    if (stocks !== undefined) updateData.stocks = parseInt(stocks);
    if (profit !== undefined) updateData.profit = parseFloat(profit);
    if (duration !== undefined) updateData.duration = parseFloat(duration);
    if (price !== undefined) updateData.price = parseFloat(price);
    if (limit !== undefined) updateData.limit = parseInt(limit); 
    if (isActive !== undefined) updateData.isActive = isActive;

    
    const numericValues = [price, profit, duration, stocks, limit].filter(val => val !== undefined);
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

