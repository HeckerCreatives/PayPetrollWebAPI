const { default: mongoose } = require("mongoose")


exports.nftdata = [
{
    _id: new mongoose.Types.ObjectId("64f8c1b2e4b0f3a1c8d5e6f7"),
    name: "IRON PUPPY",
    price: 500,
    profit: 0.5,
    duration: 6,
    type: "NFT",
    rank: "NFT",
    stocks: 10
},
{
    _id: new mongoose.Types.ObjectId("64f8c1b2e4b0f3a1c8d5e6f8"),
    name: "Shiba Ihulk",
    price: 1000,
    profit: 0.6,
    duration: 7,
    type: "NFT",
    rank: "NFT",
    stocks: 8
},
{
    _id: new mongoose.Types.ObjectId("64f8c1b2e4b0f3a1c8d5e6f9"),
    name: "Captain Hachi",
    price: 2500,
    profit: 0.8,
    duration: 8,
    type: "NFT",
    rank: "NFT",
    stocks: 5
},
{
    _id: new mongoose.Types.ObjectId("64f8c1b2e4b0f3a1c8d5e6fa"),
    name: "Thor Inu",
    price: 5000,
    profit: 1.0,
    duration: 9,
    type: "NFT",
    rank: "NFT",
    stocks: 5
},
{
    _id: new mongoose.Types.ObjectId("64f8c1b2e4b0f3a1c8d5e6fb"),
    name: "Shibathanos",
    price: 10000,
    profit: 1.2,
    duration: 10,
    type: "NFT",
    rank: "NFT",
    stocks: 3
}    
]

exports.nftlimit = [
    {
        nft: new mongoose.Types.ObjectId("64f8c1b2e4b0f3a1c8d5e6f7"), // IRON PUPPY
       limit: 1
    },
    {
        nft: new mongoose.Types.ObjectId("64f8c1b2e4b0f3a1c8d5e6f8"), // Shiba Ihulk
        limit: 2
    },
    {
        nft: new mongoose.Types.ObjectId("64f8c1b2e4b0f3a1c8d5e6f9"), // Captain Hachi
        limit: 3
    },
    {
        nft: new mongoose.Types.ObjectId("64f8c1b2e4b0f3a1c8d5e6fa"), // Thor Inu
        limit: 4
    },
    {
        nft: new mongoose.Types.ObjectId("64f8c1b2e4b0f3a1c8d5e6fb"), // Shibathanos
        limit: 5
    }
]