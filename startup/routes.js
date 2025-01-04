const express = require("express")
const test = require("../routes/test")
const users = require("../routes/users")
const bookers = require("../routes/bookers")

module.exports = function (app) {
	app.use(express.json())
	app.use("/api/test", test)
	app.use("/api/users", users)
	app.use("/api/bookers", bookers)
}
