const { default: mongoose } = require("mongoose");
const Leaderboard = require("../models/Leaderboard");


exports.getLeaderboard = async (req, res) => {
    const { id, username } = req.user;

    await Leaderboard.find({})
        .populate('owner')
        .sort({ amount: -1 })
        .limit(10)
        .then(async (top10) => {
            const user = await Leaderboard.findOne({ owner: new mongoose.Types.ObjectId(id) });

            if (!user) {
                return res.status(404).json({ message: "failed", data: "No leaderboard found" });
            }

            const userRank = await Leaderboard.countDocuments({ amount: { $gt: user.amount } });
            const finaldata = {
                user: {
                    username: user.owner.username,
                    amount: user.amount,
                    rank: userRank + 1
                },
                top10: top10.map((item, index) => {
                    return {
                        username: item.owner.username,
                        amount: item.amount,
                        rank: index + 1
                    };
                })
            };

            return res.json({ message: "success", data: finaldata });
        })
        .catch(err => {
            console.log(`There's a problem getting the leaderboard for ${username}. Error ${err}`);
            return res.status(400).json({ message: "bad-request", data: "There's a problem getting the leaderboard. Please contact customer support." });
        });
};
