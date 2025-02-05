const { default: mongoose } = require("mongoose");
const Leaderboard = require("../models/Leaderboard");
const LeaderboardHistory = require("../models/Leaderboardhistory");


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


exports.getLeaderboardHistory = async (req, res) => {

    const { page, limit, date } = req.query;

    const pageOptions = {
        page: parseInt(page, 10) || 0,
        limit: parseInt(limit, 10) || 10
    }

    const query = date ? { date } : {};

    await LeaderboardHistory.find(query)
        .populate('owner', 'username')
        .sort({ date: -1, amount: -1 })
        .skip(pageOptions.page * pageOptions.limit)
        .limit(pageOptions.limit)
        .then(data => {
            if (data.length === 0) {
                return res.status(404).json({ message: "failed", data: "No leaderboard history found" });
            }

            const finaldata = []

            let previousDate = null;
            let rank = 1;
            
            data.forEach((item, index) => {
                const currentDate = new Date(item.date).toISOString().split('T')[0]; // Convert to Date object and extract the date part
            
                if (previousDate && previousDate !== currentDate) {
                    rank = 1; // Reset rank if the date has changed
                }
            
                finaldata.push({
                    username: item.owner.username,
                    amount: item.amount,
                    date: item.date,
                    rank: rank
                });
            
                previousDate = currentDate;
                rank++;
            });

            return res.json({ message: "success", data: finaldata });
        })
        .catch(err => {
            console.log(`There's a problem getting the leaderboard history. Error ${err}`);
            return res.status(400).json({ message: "bad-request", data: "There's a problem getting the leaderboard history. Please contact customer support." });
        });
}