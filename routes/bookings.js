const auth = require("../filter-chains/auth")
const express = require("express")
const { PrismaClient } = require("@prisma/client")
const authorizeRoles = require("../filter-chains/authorizeRoles")
const { validateBooking } = require("../models/Booking")
const BookingService = require("../helpers/booking")
const prisma = new PrismaClient()
const router = express.Router()

router.post("/", [auth, authorizeRoles(["BOOKER"])], async (req, res) => {
	const bookings = req.body
	if (!Array.isArray(bookings))
		return res.status(400).send("Invalid input: Expected an array of bookings.")

	for (let i = 0; i < bookings.length; ++i) {
		const { error } = validateBooking(bookings[i])
		if (error)
			return res.status(400).send(`${error.details[0].message} for the booking at index ${i}`)
	}

	// Validate date ranges in the input array
	const dateRangesSet = new Set()
	for (let i = 0; i < bookings.length; ++i) {
		const { vehicleId, startDate, endDate } = bookings[i]
		const dateRange = `${vehicleId}-${startDate}-${endDate}`

		if (dateRangesSet.has(dateRange))
			return res.status(400).send(`Duplicate date range detected: ${dateRange} at index ${i}`)

		dateRangesSet.add(dateRange)
	}

	const createdBookings = []

	await prisma.$transaction(async (prisma) => {
		for (let i = 0; i < bookings.length; ++i) {
			const { vehicleId, startLocation, endLocation, startDate, endDate } = bookings[i]

			const existingVehicle = await prisma.vehicle.findUnique({
				where: { id: vehicleId },
			})
			if (!existingVehicle) throw new Error(`Vehicle at index ${i} not found`)

			if (existingVehicle.availabilityStatus !== "AVAILABLE")
				throw new Error(`Vehicle at index ${i} not available`)

			const bookingService = new BookingService(
				existingVehicle.dailyRate,
				startDate,
				endDate,
				req.user.latitude,
				req.user.longitude,
			)

			bookingService.calculateTotalPrice()

			const newBooking = await prisma.booking.create({
				data: {
					booker: { connect: { id: req.user.id } }, // Assuming you have auth middleware
					vehicle: { connect: { id: vehicleId } },
					startLocation,
					endLocation,
					startDate,
					endDate,
					totalPrice: bookingService.calculateTotalPrice(),
					deliveryType: bookingService.getDeliveryType(),
				},
			})
			createdBookings.push(newBooking)
		}
	})

	res.status(201).send(createdBookings)
})

router.delete("/", [auth, authorizeRoles(["BOOKER", "ADMIN"])], async (req, res) => {
	const deletedBookings = await prisma.booking.deleteMany({})

	res.send(`Deleted ${deletedBookings.count} bookings`)
})

module.exports = router
