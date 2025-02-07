const express = require("express")
const { validateUser, generateUserAuthToken, validateModifiedUser } = require("../models/user")
const _ = require("lodash")
const auth = require("../filter-chains/auth")
const authorizeRoles = require("../filter-chains/authorizeRoles")
const { prismaClient } = require("../startup/database")
const { hashPassword } = require("./auth")
const router = express.Router()

router.get("/", [auth, authorizeRoles(["EMPLOYEE", "ADMIN"])], async (req, res) => {
	const users = await prismaClient.user.findMany()

	res.send(_.map(users, (user) => _.omit(user, "password")))
})

router.get("/:id", [auth, authorizeRoles(["BOOKER", "EMPLOYEE", "ADMIN"])], async (req, res) => {
	const { id } = req.params
	const user = await prismaClient.user.findUnique({ where: { id } })

	if (!user) return res.status(404).send("User not found")
	return res.send(_.omit(user, ["password"]))
})

router.post("/", async (req, res) => {
	try {
		const { error } = validateUser(req.body)
	if (error) {
		console.log({error, details: error.details, req: req.body})
		return res.status(400).send(error.details[0].message)}

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
	} catch(error){
		console.log({error})
	}
})

router.put("/:id", async (req, res) => {
	const { id } = req.params

	const { error } = validateModifiedUser(req.params) // A separate validation function for updates
	if (error) return res.status(400).send(error.details[0].message)

	try {
		let user = await prismaClient.user.findUnique({
			where: { id },
		})

		if (!user) return res.status(404).send(`User with ID ${id} not found`)

		if (req.body.email) {
			const emailExists = await prismaClient.user.findUnique({
				where: { email: req.body.email },
			})
			if (emailExists && emailExists.id !== user.id)
				return res.status(400).send(`The email ${req.body.email} is already used`)
		}

		if (req.body.phoneNumber) {
			const phoneExists = await prismaClient.user.findUnique({
				where: { phoneNumber: req.body.phoneNumber },
			})
			if (phoneExists && phoneExists.id !== user.id)
				return res
					.status(400)
					.send(`The phone number ${req.body.phoneNumber} is already used`)
		}

		let updatedData = { ...req.body }
		if (req.body.password) {
			updatedData.password = await hashPassword(req.body.password)
		}

		user = await prismaClient.user.update({
			where: { id },
			data: updatedData,
		})

		res.status(200).send(user)
	} catch (err) {
		console.error(err)
		res.status(500).send("An error occurred while updating the user")
	}
})

router.delete("/:id", async (req, res) => {
	const { id } = req.params
	const user = await prismaClient.user.findUnique({ where: { id } })
	if (!user) return res.status(404).send("User not found")

	await prismaClient.user.delete({ where: { id } })

	res.status(200).send({ message: "User deleted successfully" })
})

module.exports = router
