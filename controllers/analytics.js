const Analytics = require("../models/Analytics");


exports.getpayingraph = async (req, res) => {
    const { id, username } = req.user;
    const { charttype } = req.query;

    if (charttype === "daily") {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const hourlyAmounts = await Analytics.aggregate([
            {
                $match: {
                    type: "payinfiatbalance",
                    createdAt: {
                        $gte: startOfDay,
                        $lt: endOfDay
                    }
                }
            },
            {
                $group: {
                    _id: { $hour: "$createdAt" },
                    totalAmount: { $sum: "$amount" }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        const result = {};
        for (let i = 0; i < 24; i++) {
            const hour = i.toString().padStart(2, '0') + ":00";
            result[hour] = 0;
        }

        hourlyAmounts.forEach(item => {
            const hour = item._id.toString().padStart(2, '0') + ":00";
            result[hour] = item.totalAmount;
        });

        return res.json({ message: "success", data: result });
    }
    else if (charttype == "weekly"){
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        // Aggregate user counts by day of the week
        const weeklyCounts = await Analytics.aggregate([
            {
                $match: {
                    type: "payinfiatbalance",
                    createdAt: {
                        $gte: startOfWeek,
                        $lt: endOfWeek
                    }
                }
            },
            {
                $group: {
                    _id: { $dayOfWeek: "$createdAt" },
                    count: { $sum: "$amount" }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Format the result as desired
        const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        const result = {};

        daysOfWeek.forEach(day => {
            result[day] = 0;
        });

        weeklyCounts.forEach(item => {
            const dayOfWeek = daysOfWeek[item._id - 1]; // MongoDB returns 1 for Sunday, 2 for Monday, etc.
            result[dayOfWeek] = item.count;
        });

        return res.json({message: "success", data: result});
    }
    else if (charttype == "monthly"){
        const startOfYear = new Date(new Date().getFullYear(), 0, 1);
        const endOfYear = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59, 999);

        // Aggregate user counts by month
        const monthlyCounts = await Analytics.aggregate([
            {
                $match: {
                    type: "payinfiatbalance",
                    createdAt: {
                        $gte: startOfYear,
                        $lt: endOfYear
                    }
                }
            },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    count: { $sum: "$amount" }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Format the result as desired
        const months = [
            "january", "february", "march", "april", "may", "june",
            "july", "august", "september", "october", "november", "december"
        ];
        const result = {};

        months.forEach(month => {
            result[month] = 0;
        });

        monthlyCounts.forEach(item => {
            const monthName = months[item._id - 1]; // MongoDB returns 1 for January, 2 for February, etc.
            result[monthName] = item.count;
        });

        return res.json({message: "success", data: result});
    }
    else if (charttype == "yearly"){
        const releaseYear = 2025;
        const currentYear = new Date().getFullYear();

        // Aggregate user counts by year
        const yearlyCounts = await Analytics.aggregate([
            {
                $match: {
                    type: "payinfiatbalance",
                }
            },
            {
                $group: {
                    _id: { $year: "$createdAt" },
                    count: { $sum: "$amount" }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Format the result as desired
        const result = {};

        for (let year = releaseYear; year <= currentYear; year++) {
            result[year] = 0;
        }

        yearlyCounts.forEach(item => {
            const year = item._id;
            if (year >= releaseYear && year <= currentYear) {
                result[year] = item.count;
            }
        });
        
        return res.json({message: "success", data: result});
    }
}


exports.gettotalpayinperday = async (req, res) => {
    const {id, username} = req.user
    const {startDate, endDate} = req.query

    const matchStage = {
        status: "done"
    };

    // Add startDate conditionally
    if (startDate) {
        matchStage.createdAt = { $gte: new Date(startDate) };
    }

    // Add endDate conditionally
    if (endDate) {
        matchStage.createdAt = matchStage.createdAt || {}; // Initialize if not already
        matchStage.createdAt.$lte = new Date(endDate);
    }

    const result = await Payin.aggregate([
        {
            // Match documents based on provided date range
            $match: matchStage
        },
        {
            // Project the date to just the day (remove time part)
            $project: {
                day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                value: 1
            }
        },
        {
            // Group by the day and sum the value
            $group: {
                _id: "$day",
                totalValue: { $sum: "$value" }
            }
        },
        {
            // Sort by date in ascending order
            $sort: { _id: 1 }
        }
    ]);

    return res.json({message: "success", data: {
        analytics: result
    }});
}