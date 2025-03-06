const { default: mongoose } = require("mongoose");
const Inventory = require("./models/Inventory");
const Trainer = require("./models/Trainer");


async function updatebanks () {
try {
    
        await mongoose.connect('mongodb+srv://cbsadmin:Creativebrain2022@creativebraindevelopmen.itmjhkl.mongodb.net/paypetroll?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });
    

        const banks = await Inventory.find({});

        for (const bank of banks) {
          
            bank.totalaccumulated = bank.totalincome
            bank.duration = 0.0007

            console.log(`Updating ${bank.petname}...`)
            await bank.save();
        }

        
} catch (error) {
    console.error(error)
}
}

updatebanks()