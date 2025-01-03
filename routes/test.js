const express = require("express")
const router = express.Router()

router.get("/", async (req, res) => {
	// Send back a response indicating success
	res.send({
		status: true,
		message: "Endpoint tested successfully.",
	})
})

module.exports = router
