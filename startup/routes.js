const express = require("express")
const auth = require("../routes/auth")
const test = require("../routes/test")
const users = require("../routes/users")

module.exports = function (app) {
	app.use(express.json())
	app.use("/api/auth", auth)
	app.use("/api/test", test)
	app.use("/api/users", users)
}
