const auth = require("../filter-chains/auth")
const express = require("express")
const authorizeRoles = require("../filter-chains/authorizeRoles")
const { validateBooking } = require("../models/Booking")
const BookingService = require("../helpers/booking")
const { prismaClient } = require("../startup/database")
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

	try {
		const createdBookings = []
		await prismaClient.$transaction(async (prismaClient) => {
			for (let i = 0; i < bookings.length; ++i) {
				const { vehicleId, startLocation, endLocation, startDate, endDate } = bookings[i]

				const existingVehicle = await prismaClient.vehicle.findUnique({
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
				await bookingService.checkVehicleAvailability(vehicleId, i)

				const newBooking = await prismaClient.booking.create({
					data: {
						booker: { connect: { id: req.user.id } },
						vehicle: { connect: { id: vehicleId } },
						startLocation,
						endLocation,
						startDate,
						endDate,
						totalPrice: bookingService.calculateTotalPrice(),
						status: new Date(startDate) > new Date() ? "PENDING" : "IN_PROGRESS",
						deliveryType: bookingService.getDeliveryType(),
					},
				})
				createdBookings.push(newBooking)
			}
		})
		res.status(201).send(createdBookings)
	} catch (exception) {
		res.status(400).send(exception.message)
	}
})

router.delete("/", [auth, authorizeRoles(["BOOKER", "ADMIN"])], async (req, res) => {
	const deletedBookings = await prismaClient.booking.deleteMany({})

	res.send(`Deleted ${deletedBookings.count} bookings`)
})

module.exports = router
