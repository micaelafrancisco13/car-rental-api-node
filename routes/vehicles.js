const express = require("express")
const { PrismaClient } = require("@prisma/client")
const { validateVehicle, validateModifiedVehicle } = require("../models/vehicle")
const auth = require("../filter-chains/auth")
const authorizeRoles = require("../filter-chains/authorizeRoles")
const prisma = new PrismaClient()
const router = express.Router()

router.get("/", [auth, authorizeRoles(["BOOKER", "EMPLOYEE", "ADMIN"])], async (req, res) => {
	const whereClause = {}
	for (const key in req.query) {
		if (key === "orderBy") continue // Skip orderBy for now
		if (key === "year") whereClause.year = parseInt(req.query.year)
		else whereClause[key] = req.query[key]
	}

	const orderByClause = req.query.orderBy ? { availabilityStatus: req.query.orderBy } : {}

	const vehicles = await prisma.vehicle.findMany({
		where: {
			...whereClause,
			availabilityStatus: whereClause?.availabilityStatus?.toUpperCase(),
		},
		orderBy: orderByClause,
	})

	res.send(vehicles)
})

router.get("/:id", [auth, authorizeRoles(["BOOKER", "EMPLOYEE", "ADMIN"])], async (req, res) => {
	const { id } = req.params
	const vehicle = await prisma.vehicle.findUnique({ where: { id } })

	if (!vehicle) return res.status(404).send("Vehicle not found")
	return res.send(vehicle)
})

router.post("/", [auth, authorizeRoles(["EMPLOYEE", "ADMIN"])], async (req, res) => {
	const vehicles = req.body
	if (!Array.isArray(vehicles))
		return res.status(400).send("Invalid input: Expected an array of vehicles.")

	for (let i = 0; i < vehicles.length; ++i) {
		const { error } = validateVehicle(vehicles[i])
		if (error)
			return res.status(400).send(`${error.details[0].message} for the vehicle at index ${i}`)
	}

	const createdVehicles = []

	await prisma.$transaction(async (prisma) => {
		for (let i = 0; i < vehicles.length; ++i) {
			const vehicle = vehicles[i]

			let existingVehicle = await prisma.vehicle.findUnique({
				where: { licensePlate: vehicle.licensePlate },
			})
			if (existingVehicle)
				throw new Error(
					`The vehicle with the license plate ${vehicle.licensePlate} is already added`,
				)

			const newVehicle = await prisma.vehicle.create({
				data: { ...vehicle },
			})
			createdVehicles.push(newVehicle)
		}
	})

	res.status(201).send(createdVehicles)
})

router.post("/update", [auth, authorizeRoles(["EMPLOYEE", "ADMIN"])], async (req, res) => {
	const data = req.body
	if (!Array.isArray(data))
		return res.status(400).send("Invalid input: Expected an array of vehicles.")

	for (let i = 0; i < data.length; ++i) {
		const { error } = validateModifiedVehicle(data[i])
		if (error)
			return res.status(400).send(`${error.details[0].message} for the vehicle at index ${i}`)
	}

	for (let i = 0; i < data.length; ++i) {
		let existingVehicle = await prisma.vehicle.findUnique({
			where: { id: data[i].id },
		})
		if (!existingVehicle) return res.status(400).send(`Vehicle at index ${i} not found`)
	}

	const updatedVehicles = []

	await prisma.$transaction(async (prisma) => {
		for (let i = 0; i < data.length; ++i) {
			const { id, vehicle } = data[i]

			const updatedVehicle = await prisma.vehicle.update({
				where: { id },
				data: { ...vehicle },
			})
			updatedVehicles.push(updatedVehicle)
		}
	})

	res.send(updatedVehicles)
})

router.delete("/", [auth, authorizeRoles(["ADMIN"])], async (req, res) => {
	const whereClause = {}
	for (const key in req.query) {
		if (key === "orderBy") continue // Skip orderBy for now
		if (key === "year") whereClause.year = parseInt(req.query.year)
		else whereClause[key] = req.query[key]
	}

	const deletedVehicles = await prisma.vehicle.deleteMany({
		where: whereClause,
	})

	res.send(`Deleted ${deletedVehicles.count} vehicles`)
})

module.exports = router
