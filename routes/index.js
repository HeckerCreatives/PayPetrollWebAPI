const routers = app => {
    console.log("Routers are all available");

    app.use("/analytics", require("./analytics"))
    app.use("/auth", require("./auth"))
    app.use("/conversionrate", require("./conversionrate"))
    app.use("/globalpass", require("./globalpass"))
    app.use("/inventory", require("./inventory"))
    app.use("/leaderboard", require("./leaderboard"))
    app.use("/maintenance", require("./maintenance"))
    app.use("/payin", require("./payin"))
    app.use("/payout", require("./payout"))
    app.use("/reset", require("./reset"))
    app.use("/sociallinks", require("./sociallinks"))
    app.use("/staffuser", require("./staffuser"))
    app.use("/trainer", require("./trainer"))
    app.use("/unilevel", require("./unilevel"))
    app.use("/user", require("./user"))
    app.use("/wallet", require("./wallet"))
    app.use("/walletconversion", require("./walletconversion"))
    app.use("/wallethistory", require("./wallethistory"))
    app.use("/ingame", require("./ingame"))
}

module.exports = routers