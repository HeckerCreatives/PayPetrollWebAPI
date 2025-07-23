const { default: mongoose } = require("mongoose");
const { nftdata } = require("../initialization/data");
const NFTTrainer = require("../models/Nfttrainer");
const NFTInventory = require("../models/Nftinventory");


exports.getlistbuynft = async (req, res) => {

    const list = await NFTInventory.find()
    .populate("owner", "_id username")
    

    const grouped = {};

list.forEach(nft => {
    const username = nft.owner.username;
    const price = parseFloat(nft.price);

    if (!grouped[username]) {
        grouped[username] = {
            username,
            list: [],
            totalbought: 0,
            totalnumberofnftbought: 0
        };
    }

    grouped[username].list.push({
        nftname: nft.petname,
        price: price
    });

    grouped[username].totalbought += price;
    grouped[username].totalnumberofnftbought += 1;
});

const result = Object.values(grouped);

    return res.json({message: "success", data: grouped})
}