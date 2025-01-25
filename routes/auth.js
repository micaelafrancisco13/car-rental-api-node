const express = require("express")
const { compare, genSalt, hash } = require("bcrypt")
const {
	generateUserAuthToken,
	validateLoginCredentials,
	validatePasswords,
	validateResetPassword,
} = require("../models/user")
const { prismaClient } = require("../startup/database")
const router = express.Router()
const auth = require("../filter-chains/auth")
const authorizeRoles = require("../filter-chains/authorizeRoles")

router.post("/login", async (req, res) => {
	const { error } = validateLoginCredentials(req.body)
	if (error) return res.status(400).send(error.details[0].message)

	const user = await prismaClient.user.findUnique({
		where: { email: req.body.email },
	})
	if (!user) return res.status(400).send("Invalid email or password")

	const validPassword = await compare(req.body.password, user.password)
	if (!validPassword) return res.status(400).send("Invalid email or password")

	const token = generateUserAuthToken(user)

	res.send(`Bearer ${token}`)
})

router.post(
	"/change-password",
	[auth, authorizeRoles(["BOOKER", "EMPLOYEE", "ADMIN"])],
	async (req, res) => {
		const { error } = validatePasswords(req.body)
		if (error) return res.status(400).send(error.details[0].message)

		const userId = req.user.id

		const user = await prismaClient.user.findUnique({
			where: { id: userId },
		})
		if (!user) return res.status(400).send("User does not exist")

		const validPassword = await compare(req.body.currentPassword, user.password)
		if (!validPassword) return res.status(400).send("Current password is incorrect")

		const newHashedPassword = await hashPassword(req.body.newPassword)

		await prismaClient.user.update({
			where: { id: userId },
			data: { password: newHashedPassword },
		})

		res.send(`Password is successfully updated`)
	},
)

router.post(
	"/reset-password",
	[auth, authorizeRoles(["BOOKER", "EMPLOYEE", "ADMIN"])],
	async (req, res) => {
		const { error } = validateResetPassword(req.body)
		if (error) return res.status(400).send(error.details[0].message)

		const userId = req.body.userId

		const user = await prismaClient.user.findUnique({
			where: { id: userId },
		})
		if (!user) return res.status(400).send("User does not exist")

		const newHashedPassword = await hashPassword(req.body.newPassword)

		await prismaClient.user.update({
			where: { id: userId },
			data: { password: newHashedPassword },
		})

		res.send(`Password is successfully reset`)
	},
)

async function hashPassword(password) {
	const salt = await genSalt(13)
	return await hash(password, salt)
}

module.exports = router
module.exports.hashPassword = hashPassword
