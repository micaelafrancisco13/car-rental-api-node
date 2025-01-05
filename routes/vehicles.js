const express = require("express")
const { PrismaClient } = require("@prisma/client")
const { validateVehicle } = require("../models/vehicle")
const _ = require("lodash")
const auth = require("../filter-chains/auth")
const admin = require("../filter-chains/admin")
const employee = require("../filter-chains/employee")
const prisma = new PrismaClient()
const router = express.Router()

router.get("/", auth, async (req, res) => {
	const whereClause = {}
	for (const key in req.query) {
		if (key === "orderBy") continue // Skip orderBy for now
		if (key === "year") whereClause.year = parseInt(req.query.year)
		else whereClause[key] = req.query[key]
	}

	const orderByClause = req.query.orderBy ? { availabilityStatus: req.query.orderBy } : {}

	const vehicles = await prisma.vehicle.findMany({
		where: whereClause,
		orderBy: orderByClause,
	})

	res.send(vehicles)
})

router.get("/:id", auth, async (req, res) => {
	const { id } = req.params
	const vehicle = await prisma.vehicle.findUnique({ where: { id } })

	if (!vehicle) return res.status(404).send("Vehicle not found")
	return res.send(vehicle)
})

router.post("/", [auth, employee, admin], async (req, res) => {
	try {
		// 1. Validate the array of vehicles
		const vehicles = req.body
		if (!Array.isArray(vehicles))
			return res.status(400).send("Invalid input: Expected an array of vehicles.")

		const createdVehicles = []

		// 2. Start a transaction
		await prisma.$transaction(async (prisma) => {
			for (let i = 0; i < vehicles.length; i++) {
				const vehicle = vehicles[i]
				const { error } = validateVehicle(vehicle)
				if (error)
					throw new Error(`${error.details[0].message} for the vehicle at index ${i}`) // Throw error to trigger rollback

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
	} catch (exception) {
		const errorMessage = `Failed to add vehicles: ${exception.message}`

		res.status(500).send(errorMessage)
	}
})

router.delete("/", [auth, employee, admin], async (req, res) => {
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
