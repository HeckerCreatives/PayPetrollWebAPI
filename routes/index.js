const routers = app => {
    console.log("Routers are all available");

    app.use("/auth", require("./auth"))
    app.use("/wallet", require("./wallet"))
}

module.exports = routers