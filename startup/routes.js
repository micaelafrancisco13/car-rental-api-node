const express = require("express")
const auth = require("../routes/auth")
const test = require("../routes/test")
const users = require("../routes/users")
const vehicles = require("../routes/vehicles")
const bookings = require("../routes/bookings")
const history = require("../routes/history")

module.exports = function (app) {
	app.use(express.json())
	app.use("/api/auth", auth)
	app.use("/api/test", test)
	app.use("/api/users", users)
	app.use("/api/vehicles", vehicles)
	app.use("/api/bookings", bookings)
	app.use("/api/history", history)
}
