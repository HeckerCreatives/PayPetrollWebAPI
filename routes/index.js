const routers = app => {
    console.log("Routers are all available");

    app.use("/auth", require("./auth"))
    app.use("/conversionrate", require("./conversionrate"))
    app.use("/inventory", require("./inventory"))
    app.use("/payin", require("./payin"))
    app.use("/payout", require("./payout"))
    app.use("/staffuser", require("./staffuser"))
    app.use("/trainer", require("./trainer"))
    app.use("/unilevel", require("./unilevel"))
    app.use("/user", require("./user"))
    app.use("/wallet", require("./wallet"))
    app.use("/walletconversion", require("./walletconversion"))
    app.use("/wallethistory", require("./wallethistory"))
}

module.exports = routers