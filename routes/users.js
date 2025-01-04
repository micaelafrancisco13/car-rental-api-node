const express = require("express")
const { PrismaClient } = require("@prisma/client")
const { genSalt, hash } = require("bcrypt")
const { validate, generateAuthToken } = require("../models/user")
const _ = require("lodash")
const prisma = new PrismaClient()
const router = express.Router()

router.get("/", async (req, res) => {
	const users = await prisma.user.findMany()

	res.send(_.map(users, (user) => _.omit(user, "password")))
})

router.get("/:id", async (req, res) => {
	const { id } = req.params
	const user = await prisma.user.findUnique({ where: { id } })

	if (!user) return res.status(404).send({ error: "User not found" })
	return res.send(_.omit(user, ["password"]))
})

router.post("/", async (req, res) => {
	const { error } = validate(req.body)
	if (error) return res.status(400).send(error.details[0].message)

	let user = await prisma.user.findUnique({ where: { email: req.body.email } })
	if (user) return res.status(400).send({ error: `The email ${req.body.email} is already used` })

	const { firstName, lastName, email, phoneNumber, password, role } = req.body

	hashPassword(password)
		.then((response) => {
			prisma.user
				.create({
					data: { firstName, lastName, email, phoneNumber, password: response, role },
				})
				.then((response) => {
					res.status(201)
						.header("Authorization", `Bearer ${generateAuthToken()}`)
						.header("access-control-expose-headers", "Authorization")
						.send(_.omit(response, ["password"]))
				})
				.catch((exception) => {
					console.error(exception)
				})
		})
		.catch((exception) => {
			console.error(exception)
		})
})

async function hashPassword(password) {
	const salt = await genSalt(13)
	return await hash(password, salt)
}

module.exports = router
