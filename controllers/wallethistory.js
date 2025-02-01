const { default: mongoose } = require("mongoose")
const Wallethistory = require("../models/Wallethistory")

exports.playerwallethistory = async (req, res) => {
    const {id, username} = req.user
    const {type, page, limit} = req.query

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    };
    
    if (type == "fiatbalance"){
        wallethistorypipeline = [
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(id), 
                    type: type
                }
            },
            {
                $sort: { "createdAt": -1 }
            },
            {
                $lookup: {
                    from: "staffusers",
                    localField: "from",
                    foreignField: "_id",
                    as: "staffuserinfo"
                }
            },
            {
                $unwind: "$staffuserinfo"
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "userinfo"
                }
            },
            {
                $unwind: "$userinfo"
            },
            {
                $project: {
                    type: 1,
                    amount: 1,
                    fromusername: "$staffuserinfo.username",
                    username: "$userinfo.username",
                    createdAt: 1
                }
            },
            {
                $skip: pageOptions.page * pageOptions.limit
            },
            {
                $limit: pageOptions.limit
            }
        ]
    }
    else{
        wallethistorypipeline = [
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(id), 
                    type: type
                }
            },
            {
                $sort: { "createdAt": -1 }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "from",
                    foreignField: "_id",
                    as: "fromuserinfo"
                }
            },
            {
                $unwind: "$fromuserinfo"
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "userinfo"
                }
            },
            {
                $unwind: "$userinfo"
            },
            {
                $project: {
                    type: 1,
                    amount: 1,
                    fromusername: "$fromuserinfo.username",
                    username: "$userinfo.username",
                    createdAt: 1,
                    trainername: 1,
                    trainerrank: 1
                }
            },
            {
                $skip: pageOptions.page * pageOptions.limit
            },
            {
                $limit: pageOptions.limit
            }
        ]
    }

    const history = await Wallethistory.aggregate(wallethistorypipeline)
    .catch(err => {

        console.log(`Failed to get wallet history data for ${username}, wallet type: ${type}, player: ${playerid} error: ${err}`)

        return res.status(401).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })
    
    const historypages = await Wallethistory.countDocuments({owner: new mongoose.Types.ObjectId(id), type: type})
    .then(data => data)
    .catch(err => {

        console.log(`Failed to get wallet history count document data for ${username}, wallet type: ${type}, player: ${id} error: ${err}`)

        return res.status(401).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    const totalPages = Math.ceil(historypages / pageOptions.limit)

    const data = {
        history: [],
        pages: totalPages
    }

    history.forEach(historydata => {
        const {username, type, amount, fromusername, trainername, trainerrank, createdAt} = historydata

        data.history.push({
            username: username,
            type: type,
            amount: amount,
            fromusername: fromusername,
            trainerrank: trainerrank,
            trainername: trainername == null ? "" : trainername,
            createdAt: createdAt
        })
    })

    return res.json({message: "success", data: data})
}


exports.getwalletstatistics = async (req, res) => {
    const {id, username} = req.user

    const finaldata = {
        game: 0,
        referral: 0,
        unilevel: 0
    }

    const statisticGame = await Wallethistory.aggregate([
        { 
            $match: { 
                owner: new mongoose.Types.ObjectId(id), 
                type: "gamebalance" 
            } 
        },
        { 
            $group: { 
                _id: null, 
                totalAmount: { $sum: "$amount" } 
            } 
        }
    ])
    .catch(err => {
        console.log(`There's a problem getting the statistics of earning game for ${username}. Error ${err}`)

        return res.status(400).json({message: "bad-request", data : "There's a problem getting the statistics of earning game. Please contact customer support."})
    })

    if (statisticGame.length > 0) {
        finaldata.game = statisticGame[0].totalAmount;
    }

    const statisticReferral = await Wallethistory.aggregate([
        { 
            $match: { 
                owner: new mongoose.Types.ObjectId(id), 
                type: "directreferralbalance" 
            } 
        },
        { 
            $group: { 
                _id: null, 
                totalAmount: { $sum: "$amount" } 
            } 
        }
    ])
    .catch(err => {
        console.log(`There's a problem getting the statistics of Referral for ${username}. Error ${err}`)

        return res.status(400).json({message: "bad-request", data : "There's a problem getting the statistics of Referral. Please contact customer support."})
    })

    if (statisticReferral.length > 0) {
        finaldata.referral = statisticReferral[0].totalAmount;
    }

    const statisticUnilevel = await Wallethistory.aggregate([
        { 
            $match: { 
                owner: new mongoose.Types.ObjectId(id), 
                type: "commissionbalance" 
            } 
        },
        { 
            $group: { 
                _id: null, 
                totalAmount: { $sum: "$amount" } 
            } 
        }
    ])
    .catch(err => {
        console.log(`There's a problem getting the statistics of Unilevel ${username}. Error ${err}`)

        return res.status(400).json({message: "bad-request", data : "There's a problem getting the statistics of Unilevel. Please contact customer support."})
    })

    if (statisticUnilevel.length > 0) {
        finaldata.unilevel = statisticUnilevel[0].totalAmount;
    }

    return res.json({message: "success", data: finaldata})
}



exports.getplayerwallethistoryforadmin = async (req, res) => {
    const {id, username} = req.user
    const {playerid, type, page, limit} = req.query

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    };
    
    let wallethistorypipeline

    if (type == "fiatbalance" || type == "gamebalance"){
        wallethistorypipeline = [
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(playerid), 
                    type: type
                }
            },
            {
                $lookup: {
                    from: "staffusers",
                    localField: "from",
                    foreignField: "_id",
                    as: "staffuserinfo"
                }
            },
            {
                $unwind: "$staffuserinfo"
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "userinfo"
                }
            },
            {
                $unwind: "$userinfo"
            },
            {
                $project: {
                    type: 1,
                    amount: 1,
                    fromusername: "$staffuserinfo.username",
                    username: "$userinfo.username",
                    createdAt: 1
                }
            },
            {
                $skip: pageOptions.page * pageOptions.limit
            },
            {
                $limit: pageOptions.limit
            }
        ]
    }
    else{
        wallethistorypipeline = [
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(playerid), 
                    type: type
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "from",
                    foreignField: "_id",
                    as: "fromuserinfo"
                }
            },
            {
                $unwind: "$fromuserinfo"
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "userinfo"
                }
            },
            {
                $unwind: "$userinfo"
            },
            {
                $project: {
                    type: 1,
                    amount: 1,
                    fromusername: "$fromuserinfo.username",
                    username: "$userinfo.username",
                    createdAt: 1
                }
            },
            {
                $skip: pageOptions.page * pageOptions.limit
            },
            {
                $limit: pageOptions.limit
            }
        ]
    }

    const history = await Wallethistory.aggregate(wallethistorypipeline)
    .catch(err => {

        console.log(`Failed to get wallet history data for ${username}, wallet type: ${type}, player: ${playerid} error: ${err}`)

        return res.status(401).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })
    
    const historypages = await Wallethistory.countDocuments({owner: new mongoose.Types.ObjectId(playerid), type: type})
    .then(data => data)
    .catch(err => {

        console.log(`Failed to get wallet history count document data for ${username}, wallet type: ${type}, player: ${playerid} error: ${err}`)

        return res.status(401).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    const totalPages = Math.ceil(historypages / pageOptions.limit)

    const data = {
        history: [],
        pages: totalPages
    }

    history.forEach(historydata => {
        const {username, type, amount, fromusername, createdAt} = historydata

        data.history.push({
            username: username,
            type: type,
            amount: amount,
            fromusername: fromusername,
            createdAt: createdAt
        })
    })

    return res.json({message: "success", data: data})
}



exports.gettopcommissions = async (req, res) => {
    const {startDate, endDate} = req.query

    const matchStage = {};

    // Add startDate conditionally
    if (startDate) {
        matchStage.createdAt = { $gte: new Date(startDate + "T00:00:00Z") };
    }

    // Add endDate conditionally
    if (endDate) {
        matchStage.createdAt = matchStage.createdAt || {}; // Initialize if not already
        matchStage.createdAt.$lte = new Date(endDate + "T00:00:00Z");
    }

    console.log(matchStage)

    const topUsers = await Wallethistory.aggregate([
        {
            // Match documents based on provided date range
            $match: matchStage
        },
        {
          // Group wallet history by user and calculate directReferralBalance and commissionBalance
          $group: {
            _id: "$owner", // Group by user (owner field)
            directReferralBalance: {
              // Sum the amounts where type is 'referral'
              $sum: {
                $cond: [{ $eq: ["$type", "directreferralbalance"] }, "$amount", 0]
              }
            },
            commissionBalance: {
              // Sum the amounts where type is 'commission'
              $sum: {
                $cond: [{ $eq: ["$type", "commissionbalance"] }, "$amount", 0]
              }
            }
          }
        },
        {
          // Calculate the total combined balance
          $addFields: {
            totalBalance: {
              $add: ["$directReferralBalance", "$commissionBalance"]
            }
          }
        },
        {
          // Sort by totalBalance in descending order
          $sort: { totalBalance: -1 }
        },
        {
          // Limit to the top 20 users
          $limit: 21
        },
        {
          // Lookup user data from the Users collection
          $lookup: {
            from: "users", // The users collection
            localField: "_id", // The owner field in walletHistorySchema
            foreignField: "_id", // The _id field in Users schema
            as: "user"
          }
        },
        {
          // Unwind the user array to get the actual user object
          $unwind: "$user"
        },
        {
            // Filter out users where username is 'creaturesmash'
            $match: {
              "user.username": { $ne: "creaturesmash" }
            }
        },
        {
          // Project the fields you want to return
          $project: {
            username: "$user.username",
            totalBalance: 1,
            directReferralBalance: 1,
            commissionBalance: 1
          }
        }
      ]);

      const data = {}
      let index = 1;

      topUsers.forEach(tempdata => {
        const { username, directReferralBalance, commissionBalance, totalBalance} = tempdata

        data[index] = {
            username: username,
            directReferralBalance: directReferralBalance,
            commissionBalance: commissionBalance,
            totalBalance: totalBalance
        }

        index++;
      })
  
      return res.json({message: "success", data: data});
}


// exports.gettotalgamedailyforuser = async (req, res) => {
//     const {userid} = req.query

//     const totalgamedaily = await Wallethistory.aggregate(
//         [
//             {
//                 $match: {
//                     owner: new mongoose.Types.ObjectId(userid),
//                     type: "Creature Daily"
//                 }
//             },
//             {
//                 $group: {
//                     _id: null,
//                     totalAmount: { $sum: "$amount" }
//                 }
//             }
//         ]
//     )

//     return res.json({message: "success", data: {
//         totalgamedaily: totalgamedaily.length > 0 ? totalgamedaily[0].totalAmount : 0,
//     }})
// }