const express = require("express")
const { PrismaClient } = require("@prisma/client")
const {
	validateVehicle,
	validateModifiedVehicle,
	validateAvailabilityStatus,
} = require("../models/vehicle")
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

	// Validate each vehicle's fields
	for (let i = 0; i < vehicles.length; ++i) {
		const { error } = validateVehicle(vehicles[i])
		if (error)
			return res.status(400).send(`${error.details[0].message} for the vehicle at index ${i}`)
	}

	// Validate license plates in the input array
	const licensePlateSet = new Set()
	for (let i = 0; i < vehicles.length; ++i) {
		const { licensePlate } = vehicles[i]
		if (licensePlateSet.has(licensePlate))
			return res
				.status(400)
				.send(`Duplicate license plate detected: ${licensePlate} at index ${i}`)

		licensePlateSet.add(licensePlate)
	}

	const createdVehicles = []
	try {
		// Validate license plates against the database and create vehicles
		await prisma.$transaction(async (prisma) => {
			for (const vehicle of vehicles) {
				const existingVehicle = await prisma.vehicle.findUnique({
					where: { licensePlate: vehicle.licensePlate },
				})
				if (existingVehicle) {
					throw new Error(
						`The vehicle with the license plate ${vehicle.licensePlate} is already added`,
					)
				}

				const newVehicle = await prisma.vehicle.create({
					data: { ...vehicle },
				})
				createdVehicles.push(newVehicle)
			}
		})

		res.status(201).send(createdVehicles)
	} catch (exception) {
		res.status(400).send(exception.message)
	}
})

router.post("/update", [auth, authorizeRoles(["EMPLOYEE", "ADMIN"])], async (req, res) => {
	const data = req.body
	if (!Array.isArray(data))
		return res.status(400).send("Invalid input: Expected an array of vehicles.")

	// Validate each vehicle's fields
	for (let i = 0; i < data.length; ++i) {
		const vehicle = data[i]
		const { error } = validateModifiedVehicle(vehicle)
		if (error)
			return res.status(400).send(`${error.details[0].message} for the vehicle at index ${i}`)
	}

	// Validate license plates in the input array
	const licensePlateSet = new Set()
	for (let i = 0; i < data.length; ++i) {
		const { licensePlate } = data[i].vehicle
		if (licensePlateSet.has(licensePlate))
			return res
				.status(400)
				.send(`Duplicate license plate detected: ${licensePlate} at index ${i}`)

		licensePlateSet.add(licensePlate)
	}

	try {
		const updatedVehicles = []

		await prisma.$transaction(async (prisma) => {
			for (let i = 0; i < data.length; ++i) {
				const { id, vehicle } = data[i]

				const existingVehicle = await prisma.vehicle.findUnique({
					where: { id },
				})
				if (!existingVehicle) throw new Error(`Vehicle at index ${i} not found`)

				const duplicateVehicle = await prisma.vehicle.findFirst({
					where: {
						licensePlate: vehicle.licensePlate,
						id: { not: id },
					},
				})

				if (duplicateVehicle)
					throw new Error(
						`Duplicate license plate detected: ${vehicle.licensePlate} already exists (attempted update at index ${i})`,
					)

				const updatedVehicle = await prisma.vehicle.update({
					where: { id },
					data: { ...vehicle },
				})
				updatedVehicles.push(updatedVehicle)
			}
		})

		res.send(updatedVehicles)
	} catch (exception) {
		res.status(exception).send(exception.message)
	}
})

router.patch(
	"/:id/availability",
	[auth, authorizeRoles(["EMPLOYEE", "ADMIN"])],
	async (req, res) => {
		const { id } = req.params

		const { error } = validateAvailabilityStatus(req.body)
		if (error) return res.status(400).send(error.details[0].message)

		const vehicle = await prisma.vehicle.findUnique({ where: { id } })
		if (!vehicle) return res.status(404).send("Vehicle not found")

		const updatedVehicle = await prisma.vehicle.update({
			where: { id },
			data: { availabilityStatus: req.body.availabilityStatus.toUpperCase() },
		})

		res.send(updatedVehicle)
	},
)

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
