const { default: mongoose } = require("mongoose");
const Leaderboard = require("../models/Leaderboard");
const LeaderboardHistory = require("../models/Leaderboardhistory");
const Leaderboardlimit = require("../models/Leaderboardlimit");


exports.getLeaderboard = async (req, res) => {
    const { id, username } = req.user;

    
    const templimit = await Leaderboardlimit.find()

    let finallimit = 10

    if (templimit.length > 0){
        finallimit = templimit[0].limit
    }

    await Leaderboard.find({})
        .populate('owner')
        .sort({ amount: -1 })
        .limit(finallimit)
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

exports.getLeaderboardsa = async (req, res) => {
    const { id, username } = req.user;

    const templimit = await Leaderboardlimit.find()

    let finallimit = 10

    if (templimit.length > 0){
        finallimit = templimit[0].limit
    }

    await Leaderboard.find({})
        .populate('owner')
        .sort({ amount: -1 })
        .limit(finallimit)
        .then(async (top10) => {
            const finaldata = {
                top10: top10.map((item, index) => {
                    return {
                        username: item.owner.username || "N/A",
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
        limit: parseInt(limit, 20) || 20
    };

    let query = {};
    if (date) {
        query.eventname = { $regex: new RegExp(`^${date}`) }; // Allow date search in YYYY-MM-DD format
    }

    try {
        const totalDocuments = await LeaderboardHistory.countDocuments(query);
        const data = await LeaderboardHistory.find(query)
            .populate('owner', 'username')
            .sort({ date: 1, amount: -1 }) // Sort by date in ascending order
            .skip(pageOptions.page * pageOptions.limit)
            .limit(pageOptions.limit);

        if (data.length === 0) {
            return res.status(404).json({ message: "failed", data: "No leaderboard history found" });
        }

        const finaldata = [];
        let previousDate = null;
        let rank = pageOptions.page * pageOptions.limit + 1; // Initialize rank based on the page

        data.forEach((item, index) => {
            const currentDate = item.date.split(' ')[0]; // Extract the date part from the string

            if (previousDate && previousDate !== currentDate) {
                rank = pageOptions.page * pageOptions.limit + 1; // Reset rank if the date has changed
            }

            // console.log(item.owner?.username, item.amount, currentDate, rank, item.index);
            finaldata.push({
                username: item.owner?.username || "N/A",
                amount: item.amount,
                date: item.date,
                rank: rank,
                index: item.index,
            });

            previousDate = currentDate;
            rank++;
        });

        const totalPages = Math.ceil(totalDocuments / pageOptions.limit);

        return res.json({ message: "success", data: finaldata, totalPages: totalPages });
    } catch (err) {
        console.log(`There's a problem getting the leaderboard history. Error ${err}`);
        return res.status(400).json({ message: "bad-request", data: "There's a problem getting the leaderboard history. Please contact customer support." });
    }
};

exports.getLeaderboardDates = async (req, res) => {
    try {
        const dates = await LeaderboardHistory.aggregate([
            {
            $group: {
                _id: { $substr: ["$eventname", 0, -1] },
                index: { $first: "$index" }
            }
            },
            { $sort: { index: 1 } } // Sort by index in ascending order
        ]);

        if (dates.length === 0) {
            return res.status(404).json({ message: "failed", data: "No dates found in leaderboard history" });
        }

        const formattedDates = dates.map(date => date._id);

        return res.json({ message: "success", data: formattedDates });
    } catch (err) {
        console.log(`There's a problem getting the leaderboard dates. Error ${err}`);
        return res.status(400).json({ message: "bad-request", data: "There's a problem getting the leaderboard dates. Please contact customer support." });
    }
};

exports.getlblimit = async (req, res) => {
    const {id} = req.user

    const templimit = await Leaderboardlimit.find()

    if (templimit.length <= 0){
        return res.json({message: "success", data: {
            limit: 10
        }})
    }

    return res.json({message: "success", data: {
        limit: templimit[0].limit
    }})
}

exports.savelblimit = async (req, res) => {
    const {id} = req.user

    const {limit} = req.body

    if (limit > 20){
        return res.status(400).json({message: "failed", data: "Maximum limit is 20"})
    }

    const templimit = await Leaderboardlimit.find()

    if (templimit.length <= 0){
        await Leaderboardlimit.create({limit: limit})
        return res.json({message: "success"})
    }

    await Leaderboardlimit.findOneAndUpdate({_id: new mongoose.Types.ObjectId(templimit[0]._id)}, {limit: limit})

    return res.json({message: "success"})
}