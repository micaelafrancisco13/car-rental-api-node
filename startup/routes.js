const express = require("express")
const test = require("../routes/test")
const users = require("../routes/users")

module.exports = function (app) {
	app.use(express.json())
	app.use("/api/test", test)
	app.use("/api/users", users)
}
