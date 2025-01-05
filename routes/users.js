const express = require("express")
const { PrismaClient } = require("@prisma/client")
const { genSalt, hash } = require("bcrypt")
const { validateUser, generateUserAuthToken } = require("../models/user")
const _ = require("lodash")
const auth = require("../filter-chains/auth")
const prisma = new PrismaClient()
const router = express.Router()

router.get("/", auth, async (req, res) => {
	const users = await prisma.user.findMany()

	res.send(_.map(users, (user) => _.omit(user, "password")))
})

router.get("/:id", auth, async (req, res) => {
	const { id } = req.params
	const user = await prisma.user.findUnique({ where: { id } })

	if (!user) return res.status(404).send("User not found")
	return res.send(_.omit(user, ["password"]))
})

router.post("/", async (req, res) => {
	const { error } = validateUser(req.body)
	if (error) return res.status(400).send(error.details[0].message)

	let user = await prisma.user.findUnique({
		where: { email: req.body.email },
	})
	if (user)
		return res
			.status(400)
			.send(`The email ${req.body.email} is already used`)

	user = await prisma.user.findUnique({
		where: { phoneNumber: req.body.phoneNumber },
	})
	if (user)
		return res
			.status(400)
			.send(`The phone number ${req.body.phoneNumber} is already used`)

	const { firstName, lastName, email, phoneNumber, password, role } = req.body
	const hashedPassword = await hashPassword(password)
	const newUser = await prisma.user.create({
		data: {
			firstName,
			lastName,
			email,
			phoneNumber,
			password: hashedPassword,
			role,
		},
	})
	res.status(201)
		.header("Authorization", `Bearer ${generateUserAuthToken(newUser)}`)
		.header("access-control-expose-headers", "Authorization")
		.send(_.omit(newUser, ["password"]))
})

async function hashPassword(password) {
	const salt = await genSalt(13)
	return await hash(password, salt)
}

module.exports = router
