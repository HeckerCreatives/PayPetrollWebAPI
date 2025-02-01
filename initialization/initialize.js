const StaffUser = require("../models/Staffusers")
const { default: mongoose } = require("mongoose")
const Trainer = require("../models/Trainer")
const Users = require("../models/Users")
const Userdetails = require("../models/Userdetails")
const Userwallets = require("../models/Userwallets")
const StaffUserwallets = require("../models/Staffuserwallets")
const Maintenance = require("../models/Maintenance")
const Leaderboard = require("../models/Leaderboard")
const Sociallinks = require("../models/Sociallinks")


exports.initialize = async () => {

    const csadmin = await Users.findOne({username: "paypetroll"})
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting cs user data ${err}`)
        return
    })

    if (!csadmin){
        const player = await Users.create({_id: new mongoose.Types.ObjectId(process.env.PAYPETROLLS_ID), username: "paypetroll", password: "LAksaODA01asIAS", gametoken: "", webtoken: "", bandate: "none", banreason: "", status: "active"})
        
        
        await Userdetails.create({owner: new mongoose.Types.ObjectId(player._id), phonenumber: "", fistname: "", lastname: "", address: "", city: "", country: "", postalcode: "", profilepicture: ""})
        .catch(async err => {

            await Users.findOneAndDelete({_id: new mongoose.Types.ObjectId(player._id)})

            console.log(`Server Initialization Failed, Error: ${err}`);

            return
        })
    
        const wallets = ["fiatbalance", "gamebalance", "commissionbalance"]

        wallets.forEach(async (data) => {
            await Userwallets.create({owner: new mongoose.Types.ObjectId(player._id), type: data, amount: 0})
            .catch(async err => {

                await Users.findOneAndDelete({_id: new mongoose.Types.ObjectId(player._id)})


                await Userdetails.findOneAndDelete({_id: new mongoose.Types.ObjectId(player._id)})

                console.log(`Server Initialization Failed, Error: ${err}`);
    
                return
            })
        })

        console.log("cs user created")

        
    }
    const adminz = await StaffUser.find({ auth: "admin"})
    .then(data => data)
    .catch(err => {
        console.log(`Error finding the admin data: ${err}`)
        return
    })

    if(adminz.length <= 0 ){
        await StaffUser.create({ username: "paypetrolladmin", password: "LAksaODA01asIAS", webtoken: "", status: "active", auth: "admin"})
        .catch(err => {
            console.log(`Error saving admin data: ${err}`)
            return
        }) 

        await StaffUserwallets.create({owner: new mongoose.Types.ObjectId(process.env.PAYPETROLLS_ID), type: "adminfee", amount: 0})
        .catch(async err => {

            await StaffUser.findOneAndDelete({_id: new mongoose.Types.ObjectId(process.env.PAYPETROLLS_ID)})

            console.log(`There's a problem creating admin fee wallet Error: ${err}`)

            return res.status(400).json({ message: "bad-request", data: "There's a problem registering your account. Please try again." })
        })

    }

    const admin = await StaffUser.find({ auth: "superadmin"})
    .then(data => data)
    .catch(err => {
        console.log(`Error finding the admin data: ${err}`)
        return
    })

    if(admin.length <= 0 ){
        await StaffUser.create({ _id: new mongoose.Types.ObjectId(process.env.PAYPETROLLS_ID), username: "paypetrollsuperadmin", password: "LAksaODA01asIAS", webtoken: "", status: "active", auth: "superadmin"})
        .catch(err => {
            console.log(`Error saving admin data: ${err}`)
            return
        }) 

        await StaffUserwallets.create({owner: new mongoose.Types.ObjectId(process.env.PAYPETROLLS_ID), type: "adminfee", amount: 0})
        .catch(async err => {

            await StaffUser.findOneAndDelete({_id: new mongoose.Types.ObjectId(process.env.PAYPETROLLS_ID)})

            console.log(`There's a problem creating admin fee wallet Error: ${err}`)

            return res.status(400).json({ message: "bad-request", data: "There's a problem registering your account. Please try again." })
        })

    }

    const maintenancelist = await Maintenance.find()
    .then(data => data)
    .catch(err => {
        console.log("there's a problem getting maintenance list")

        return
    })

    if (maintenancelist.length <= 0){
        const maintenancelistdata = ["fightgame", "eventgame", "fullgame", "payout", "b1t1"]

        maintenancelistdata.forEach(async maintenancedata => {
            await Maintenance.create({type: maintenancedata, value: "0"})
            .catch(err => {
                console.log(`there's a problem creating maintenance list ${err}`)

                return
            })
        })
        console.log("Maintenance initalized")
    }


    const trainer = await Trainer.find()
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting trainer data ${err}`)
        return
    })

    if(trainer.length <= 0){
        const trainers = [
            {
            name: "Sky",
            min: 500,
            max: 5000,
            profit: 0.15,
            duration: 5,
            animal: "Bird",
            rank: "Novice"
            },
            {
            name: "Krom", // wrong name
            min: 500,
            max: 5000,
            profit: 0.15,
            duration: 5,
            animal: "Cat",
            rank: "Novice"
            },
            {
            name: "Rocky",
            min: 500,
            max: 5000,
            profit: 0.15,
            duration: 5,
            animal: "Dog",
            rank: "Novice"
            },
            {
            name: "Finn",
            min: 500,
            max: 5000,
            profit: 0.15,
            duration: 5,
            animal: "Fish",
            rank: "Novice"
            },
            {
            name: "Hamster",
            min: 500,
            max: 5000,
            profit: 0.15,
            duration: 5,
            animal: "Chip",
            rank: "Novice"
            },
            // Expert
            {
            name: "Mango",
            min: 1000,
            max: 20000,
            profit: 0.40,
            duration: 10,
            animal: "Bird",
            rank: "Expert"
            },
            {
            name: "Luna",
            min: 1000,
            max: 20000,
            profit: 0.40,
            duration: 10,
            animal: "Cat",
            rank: "Expert"
            },
            {
            name: "Max",
            min: 1000,
            max: 20000,
            profit: 0.40,
            duration: 10,
            animal: "Dog",
            rank: "Expert"
            },
            {
            name: "Moby",
            min: 1000,
            max: 20000,
            profit: 0.40,
            duration: 10,
            animal: "Fish",
            rank: "Expert"
            },
            {
            name: "Rusty",
            min: 1000,
            max: 20000,
            profit: 0.40,
            duration: 10,
            animal: "Hamster",
            rank: "Expert"
            },
       // Elite     
            {
            name: "Chirpy",
            min: 5000,
            max: 50000,
            profit: 3,
            duration: 15,
            animal: "Bird",
            rank: "Ace"
            },
            {
            name: "Ash",
            min: 5000,
            max: 50000,
            profit: 3,
            duration: 15,
            animal: "Cat",
            rank: "Ace"
            },
            {
            name: "Rex",
            min: 5000,
            max: 50000,
            profit: 3,
            duration: 15,
            animal: "Dog",
            rank: "Ace"
            },
            {
            name: "Tank",
            min: 5000,
            max: 50000,
            profit: 3,
            duration: 15,
            animal: "Fish",
            rank: "Ace"
            },
            {
            name: "Sugar",
            min: 5000,
            max: 50000,
            profit: 3,
            duration: 15,
            animal: "Hamster",
            rank: "Ace"
            },
            // // Ace of Spade
            // {
            // name: "Jet",
            // min: 5000,
            // max: 50000,
            // profit: 3,
            // duration: 15,
            // animal: "Bird",
            // rank: "Ace of Spade"
            // },
            // {
            // name: "Milo",
            // min: 5000,
            // max: 50000,
            // profit: 3,
            // duration: 15,
            // animal: "Cat",
            // rank: "Ace of Spade"
            // },
            // {
            // name: "Zoey",
            // min: 5000,
            // max: 50000,
            // profit: 3,
            // duration: 15,
            // animal: "Dog",
            // rank: "Ace of Spade"
            // },
            // {
            // name: "Blob",
            // min: 5000,
            // max: 50000,
            // profit: 3,
            // duration: 15,
            // animal: "Fish",
            // rank: "Ace of Spade"
            // },
            // {
            // name: "Mochi",
            // min: 5000,
            // max: 50000,
            // profit: 3,
            // duration: 15,
            // animal: "Spiky",
            // rank: "Ace of Spade"
            // },
            // // Ace of Heart
            // {
            // name: "Bird",
            // min: 5000,
            // max: 50000,
            // profit: 3,
            // duration: 15,
            // animal: "Tango",
            // rank: "Ace of Heart"
            // },
            // {
            // name: "Leo",
            // min: 5000,
            // max: 50000,
            // profit: 3,
            // duration: 15,
            // animal: "Cat",
            // rank: "Ace of Heart"
            // },
            // {
            // name: "Ace",
            // min: 5000,
            // max: 50000,
            // profit: 3,
            // duration: 15,
            // animal: "Dog",
            // rank: "Ace of Heart"
            // },
            // {
            // name: "Jelly",
            // min: 5000,
            // max: 50000,
            // profit: 3,
            // duration: 15,
            // animal: "Fish",
            // rank: "Ace of Heart"
            // },
            // {
            // name: "Spiky",
            // min: 5000,
            // max: 50000,
            // profit: 3,
            // duration: 15,
            // animal: "Hamster",
            // rank: "Ace of Heart"
            // }
        ];

        await Trainer.bulkWrite(
            trainers.map((trainer) => ({
                insertOne: { document: trainer },
            }))
        )
        .then(data => data)
        .catch(err => {
            console.log(`There's a problem creating creature data ${err}`)
            return
        })
    }

    // initialize leaderboard for existing users

    // const users = await Users.find()
    // .then(data => data)
    // .catch(err => {
    //     console.log(`There's a problem getting users data ${err}`)
    //     return
    // })

    // if(users.length > 0){
    //     users.forEach(async user => {
    //         const hasleaderboard = await Leaderboard.findOne({owner: new mongoose.Types.ObjectId(user._id)})

    //         if(!hasleaderboard){
    //         await Leaderboard.create({owner: new mongoose.Types.ObjectId(user._id), amount: 0})
    //         .catch(err => {
    //             console.log(`There's a problem creating leaderboard data ${err}`)
    //             return
    //         })
    //         console.log(`Leaderboard for ${user.username} created`)
    //     }

    //     })
    // }

    // const usersWithoutGameId = await Users.find({ gameid: { $exists: false } });

    //     for (const user of usersWithoutGameId) {
    //         let unique = false;
    //         while (!unique) {
    //             const gameid = Math.floor(1000000000 + Math.random() * 9000000000).toString(); // Generate a 10-digit number
    //             const existingUser = await Users.findOne({ gameid });
    //             if (!existingUser) {
    //                 user.gameid = gameid;
    //                 unique = true;
    //             }
    //         }
    //         await user.save();
    //         console.log(`Game ID ${user.gameid} assigned to user ${user.username}`);
    //     }

    //     console.log("Game ID initialization complete.");

    const sociallinks = await Sociallinks.find()
    .then(data => data)
    .catch(err => {
        console.log(`Error finding Social Links data: ${err}`)
    })


    if(sociallinks.length <= 0){
        const socialinksdata = ["facebook", "discord", "telegram", "tiktok"]

        const socialinksbulkwrite = socialinksdata.map(titles => ({
            insertOne: {
                document: { title: titles, link: ""}
            }
        }))

        await Sociallinks.bulkWrite(socialinksbulkwrite)
        .catch(err => {
            console.log(`Error creating social links data: ${err}`)
            return
        }) 
    }


    console.log("SERVER DATA INITIALIZED")
}