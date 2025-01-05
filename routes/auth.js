const express = require("express")
const { PrismaClient } = require("@prisma/client")
const { compare } = require("bcrypt")
const { generateUserAuthToken, validateLoginCredentials } = require("../models/user")
const prisma = new PrismaClient()
const router = express.Router()

router.post("/login", async (req, res) => {
	const { error } = validateLoginCredentials(req.body)
	if (error) return res.status(400).send(error.details[0].message)

	const user = await prisma.user.findUnique({
		where: { email: req.body.email },
	})
	if (!user) return res.status(400).send("Invalid email or password")

	const validPassword = await compare(req.body.password, user.password)
	if (!validPassword) return res.status(400).send("Invalid email or password")

	const token = generateUserAuthToken(user)

	res.send(`Bearer ${token}`)
})

module.exports = router
