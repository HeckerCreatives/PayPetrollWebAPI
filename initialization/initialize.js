const StaffUser = require("../models/Staffusers")
const { default: mongoose } = require("mongoose")
const Trainer = require("../models/Trainer")
const Users = require("../models/Users")
const Userdetails = require("../models/Userdetails")
const Userwallets = require("../models/Userwallets")
const StaffUserwallets = require("../models/Staffuserwallets")


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

    const admin = await StaffUser.find({ auth: "superadmin"})
    .then(data => data)
    .catch(err => {
        console.log(`Error finding the admin data: ${err}`)
        return
    })

    if(admin.length <= 0 ){
        await StaffUser.create({ username: "paypetrolladmin", password: "LAksaODA01asIAS", webtoken: "", status: "active", auth: "superadmin"})
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

    const trainer = await Trainer.find()
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting trainer data ${err}`)
        return
    })

    if(trainer.length <= 0){
        const trainers = [
            {
            name: "Novice Trainer",
            min: 500,
            max: 5000,
            profit: 0.15,
            duration: 5,
            rank: "Novice"
            },
            {
            name: "Expert Trainer",
            min: 1000,
            max: 20000,
            profit: 0.40,
            duration: 10,
            rank: "Expert"
            },
            {
            name: "Elite Trainer",
            min: 5000,
            max: 50000,
            profit: 3,
            duration: 15,
            rank: "Elite"
            }
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


    console.log("SERVER DATA INITIALIZED")
}