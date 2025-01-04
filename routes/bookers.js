const express = require("express")
const { PrismaClient } = require("@prisma/client")
const _ = require("lodash")
const { validateBooker, generateAuthToken, generateBookerAuthToken } = require("../models/booker")
const prisma = new PrismaClient()
const router = express.Router()

router.get("/", async (req, res) => {
	const bookers = await prisma.booker.findMany({
		include: {
			user: {
				select: {
					firstName: true,
					lastName: true,
					email: true,
					phoneNumber: true,
					role: true,
					createdAt: true,
					updatedAt: true,
				},
			},
		},
	})

	res.send(_.map(bookers, (booker) => _.omit(booker, "password")))
})

router.get("/:id", async (req, res) => {
	const { id } = req.params
	const booker = await prisma.booker.findUnique({
		where: { id },
		include: {
			user: {
				select: {
					firstName: true,
					lastName: true,
					email: true,
					phoneNumber: true,
					role: true,
					createdAt: true,
					updatedAt: true,
				},
			},
		},
	})

	if (!booker) return res.status(404).send("booker not found")
	return res.send(_.omit(booker, ["password"]))
})

router.post("/", async (req, res) => {
	const { error } = validateBooker(req.body)
	if (error) return res.status(400).send(error.details[0].message)

	const { userId } = req.body

	const user = await prisma.user.findUnique({ where: { id: userId } })
	if (!user) return res.status(400).send(`User not found`)
	if (user.role !== "CUSTOMER") return res.status(400).send("Only customers can become bookers")

	let booker = await prisma.booker.findUnique({ where: { userId } })
	if (booker) return res.status(400).send(`User is already a booker`)

	booker = await prisma.booker.create({
		data: {
			user: {
				connect: { id: userId },
			},
		},
		include: {
			user: true,
		},
	})

	const newBooker = {
		bookerId: booker.id,
		..._.pick(booker, ["userId"]),
		..._.omit(booker.user, ["password"]),
	}

	res.status(201)
		.header("Authorization", `Bearer ${generateBookerAuthToken(newBooker)}`)
		.header("access-control-expose-headers", "Authorization")
		.send(newBooker)
})

module.exports = router
