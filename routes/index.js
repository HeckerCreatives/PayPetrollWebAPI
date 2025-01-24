const routers = app => {
    console.log("Routers are all available");

    app.use("/auth", require("./auth"))
    app.use("/staffuser", require("./staffuser"))
    app.use("/unilevel", require("./unilevel"))
    app.use("/wallet", require("./wallet"))
    app.use("/wallethistory", require("./wallethistory"))
}

module.exports = routers