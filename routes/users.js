const express = require("express")
const { genSalt, hash } = require("bcrypt")
const { validateUser, generateUserAuthToken } = require("../models/user")
const _ = require("lodash")
const auth = require("../filter-chains/auth")
const authorizeRoles = require("../filter-chains/authorizeRoles")
const { prismaClient } = require("../startup/database")
const router = express.Router()

router.get("/", [auth, authorizeRoles(["EMPLOYEE", "ADMIN"])], async (req, res) => {
	const users = await prismaClient.user.findMany()

	res.send(_.map(users, (user) => _.omit(user, "password")))
})

router.get("/me", [auth, authorizeRoles(["BOOKER", "EMPLOYEE", "ADMIN"])], async (req, res) => {
	res.send(req.user)
})

router.get("/:id", [auth, authorizeRoles(["BOOKER", "EMPLOYEE", "ADMIN"])], async (req, res) => {
	const { id } = req.params
	const user = await prismaClient.user.findUnique({ where: { id } })

	if (!user) return res.status(404).send("User not found")
	return res.send(_.omit(user, ["password"]))
})

router.post("/", async (req, res) => {
	const { error } = validateUser(req.body)
	if (error) return res.status(400).send(error.details[0].message)

	let user = await prismaClient.user.findUnique({
		where: { email: req.body.email },
	})
	if (user) return res.status(400).send(`The email ${req.body.email} is already used`)

	user = await prismaClient.user.findUnique({
		where: { phoneNumber: req.body.phoneNumber },
	})
	if (user)
		return res.status(400).send(`The phone number ${req.body.phoneNumber} is already used`)

	const hashedPassword = await hashPassword(req.body.password)
	const newUser = await prismaClient.user.create({
		data: {
			...req.body,
			password: hashedPassword,
		},
	})
	res.status(201)
		.header("Authorization", `Bearer ${generateUserAuthToken(newUser)}`)
		.header("access-control-expose-headers", "Authorization")
		.send(_.omit(newUser, ["password"]))
})

router.delete("/:id", async (req, res) => {
	const { id } = req.params
	const user = await prismaClient.user.findUnique({ where: { id } })
	if (!user) return res.status(404).send("User not found")
	
    await prismaClient.user.delete({ where: { id } });

    res.status(200).send({ message: "User deleted successfully" });
})

async function hashPassword(password) {
	const salt = await genSalt(13)
	return await hash(password, salt)
}

module.exports = router
