const auth = require("../filter-chains/auth")
const express = require("express")
const authorizeRoles = require("../filter-chains/authorizeRoles")
const router = express.Router()

router.get("/", [auth, authorizeRoles(["ADMIN"])], async (req, res) => {
	// Send back a response indicating success
	res.send({
		status: true,
		message: "Endpoint tested successfully.",
	})
})

module.exports = router
