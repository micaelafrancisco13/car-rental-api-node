const auth = require("../filter-chains/auth")
const express = require("express")
const authorizeRoles = require("../filter-chains/authorizeRoles")
const router = express.Router()
const { prismaClient } = require("../startup/database")

router.get("/:id", [auth, authorizeRoles(["BOOKER", "EMPLOYEE", "ADMIN"])], async (req, res) => {
	const { id } = req.params
	const trips = await prismaClient.tripHistory.findMany({ where: { bookingId: id },
		include: {
			locations: true
		}
	})

	if (!trips.length) return res.status(404).send("History not found")
	return res.send(trips)
})

module.exports = router
