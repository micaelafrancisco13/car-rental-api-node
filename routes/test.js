const auth = require("../filter-chains/auth")
const admin = require("../filter-chains/admin")
const express = require("express")
const router = express.Router()

router.get("/", [auth, admin], async (req, res) => {
	// Send back a response indicating success
	res.send({
		status: true,
		message: "Endpoint tested successfully.",
	})
})

module.exports = router
