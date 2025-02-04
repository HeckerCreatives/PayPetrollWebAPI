const { default: mongoose } = require("mongoose")
const Sociallinks = require("../models/Sociallinks")


exports.createsociallink = async (req, res) => {
    const { title, link } = req.body

    if(!title || !link){
        return res.status(400).json({ message: "failed", data: "Please input title and link."})
    }

    const isExisting = await Sociallinks.findOne({ title: { $regex: title, $options: "i" } });

    if(isExisting){
        return res.status(400).json({ message: "failed", data: `Social link with title ${title} already exists.`})
    }
    await Sociallinks.create({
        title,
        link
    })
    .then(data => {
        if(!data){
            return res.status(400).json({ message: "bad-request", data: "There's a problem with the server. Please contact support for more details."})
        }
        return res.status(200).json({ message: "success" })
    })
    .catch(err => {
        console.log(`There's a problem encountered while creating social link. Error: ${err}`)
        return res.status(400).json({ message: "bad-request", data: "There's a problem with the server. Please contact support for more details."})
    })
}

exports.editsociallink = async (req, res) => {
    const { id, title, link } = req.body
    if(!title || !link || !id){
        return res.status(400).json({ message: "failed", data: "Please input title, link and social link to edit."})
    }


    
    const isExisting = await Sociallinks.findOne({ 
        title: { $regex: title, $options: "i" },
        _id: { $ne: new mongoose.Types.ObjectId(id) }
    });
    
    if (isExisting) {
        return res.status(400).json({ message: "failed", data: `Social link with title ${title} already exists.` });
    }


    await Sociallinks.findOneAndUpdate(
        {
            _id: new mongoose.Types.ObjectId(id)
        },
        {
        title,
        link
        }
    )
    .then(data => {
        if(!data){
            return res.status(400).json({ message: "bad-request", data: "There's a problem with the server. Please contact support for more details."})
        }
        return res.status(200).json({ message: "success" })
    })
    .catch(err => {
        console.log(`There's a problem encountered while creating social link. Error: ${err}`)
        return res.status(400).json({ message: "bad-request", data: "There's a problem with the server. Please contact support for more details."})
    })
}

exports.deletesociallink = async (req, res) => {
    const { id } = req.query
    if(!id){
        return res.status(400).json({ message: "failed", data: "Please select social link to delete."})
    }
    await Sociallinks.findOneAndDelete({ _id: new mongoose.Types.ObjectId(id) })
    .then(data => {
        if(!data){
            return res.status(400).json({ message: "bad-request", data: "There's a problem with the server. Please contact support for more details."})
        }
        return res.status(200).json({ message: "success" })
    })
    .catch(err => {
        console.log(`There's a problem encountered while creating social link. Error: ${err}`)
        return res.status(400).json({ message: "bad-request", data: "There's a problem with the server. Please contact support for more details."})
    })
}

exports.getsociallinks = async (req, res) => {
    const { page, limit } = req.query

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10,
    }
    
    await Sociallinks.find()
    .skip(pageOptions.page * pageOptions.limit)
    .limit(pageOptions.limit)   
    .then(data => {
        if(!data){
            return res.status(400).json({ message: "failed", data: "No social links data found."})
        }
        return res.status(200).json({ message: "success", data: data })
    })
    .catch(err => {
        console.log(`There's a problem encountered while fetching social link. Error: ${err}`)
        return res.status(400).json({ message: "bad-request", data: "There's a problem with the server. Please contact support for more details."})
    })
}

exports.getspecificsociallink = async (req, res) => {
    const { title } = req.query
    await Sociallinks.findOne({
        title: { $regex: title, $options: "i" },
    })    
    .then(data => {
        if(!data){
            return res.status(400).json({ message: "failed", data: "No social links data found."})
        }
        return res.status(200).json({ message: "success", data: data })
    })
    .catch(err => {
        console.log(`There's a problem encountered while fetching social link. Error: ${err}`)
        return res.status(400).json({ message: "bad-request", data: "There's a problem with the server. Please contact support for more details."})
    })
}