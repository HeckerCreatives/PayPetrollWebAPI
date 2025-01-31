const mongoose = require("mongoose");
const bcrypt = require('bcrypt');

const UsersSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            index: true // Automatically creates an index on 'amount'
        },
        password: {
            type: String
        },
        referral: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users",
            index: true // Automatically creates an index on 'amount'
        },
        gametoken: {
            type: String
        },
        webtoken: {
            type: String
        },
        // moletoken: {
        //     type: String
        // },
        bandate: {
            type: String
        },
        banreason: {
            type: String
        },
        status: {
            type: String,
            default: "active",
            index: true // Automatically creates an index on 'amount'
        }
    },
    {
        timestamps: true
    }
)

UsersSchema.pre("save", async function (next) {

    if (this.isNew) {
        let unique = false;
        while (!unique) {
            const gameid = Math.floor(1000000000 + Math.random() * 9000000000).toString(); // Generate a 10-digit number
            const existingUser = await mongoose.models.Users.findOne({ gameid });
            if (!existingUser) {
                this.gameid = gameid;
                unique = true;
            }
        }
    }
    if (!this.isModified){
        next();
    }

    this.password = await bcrypt.hashSync(this.password, 10)
})



UsersSchema.methods.matchPassword = async function(password){
    return await bcrypt.compare(password, this.password)
}

const Users = mongoose.model("Users", UsersSchema)
module.exports = Users