const auth = require("../filter-chains/auth")
const express = require("express")
const authorizeRoles = require("../filter-chains/authorizeRoles")
const { validateBooking, validateStatus, validatePaymentStatus } = require("../models/booking")
const BookingService = require("../helpers/booking")
const { prismaClient } = require("../startup/database")
const { DEFAULT_SORT_BY, DEFAULT_ORDER } = require("../helpers/constants")
const router = express.Router()

const buildBookingFilter = (query) => {
	const filter = {}
	if (query.bookerId) filter.bookerId = query.bookerId
	if (query.vehicleId) filter.vehicleId = query.vehicleId
	if (query.status) filter.status = query.status
	if (query.paymentStatus) filter.paymentStatus = query.paymentStatus
	if (query.deliveryType) filter.deliveryType = query.deliveryType
	if (query.startDate && query.endDate) {
		filter.startDate = { gte: new Date(query.startDate) }
		filter.endDate = { lte: new Date(query.endDate) }
	}
	return filter
}

router.get("/", async (req, res) => {
	const filter = buildBookingFilter(req.query)

	const bookings = await prismaClient.booking.findMany({
		where: filter,
		orderBy: { [req.query.sortBy || DEFAULT_SORT_BY]: req.query.order || DEFAULT_ORDER },
		include: {
			booker: true,
			vehicle: true,
			fleetTracking: true,
		},
	})

	res.send(bookings)
})

router.get("/my", [auth, authorizeRoles(["BOOKER"])], async (req, res) => {
	const filter = {
		bookerId: req.user.id,
		status: {
			notIn: ["CANCELLED", "COMPLETED"],
		},
	}
	const bookings = await prismaClient.booking.findMany({
		where: filter,
		include: {
			vehicle: true,
			booker: true,
		},
	})

	res.send(bookings)
})

router.post("/", [auth, authorizeRoles(["BOOKER"])], async (req, res) => {
	const bookings = req.body
	if (!Array.isArray(bookings))
		return res.status(400).send("Invalid input: Expected an array of bookings.")

	for (let i = 0; i < bookings.length; ++i) {
		const { error } = validateBooking(bookings[i])
		if (error)
			return res.status(400).send(`${error.details[0].message} for the booking at index ${i}`)
	}

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

router.patch(
	"/:id/status",
	[auth, authorizeRoles(["BOOKER","EMPLOYEE", "ADMIN"])],
	async (req, res) => {
		const { id } = req.params

		const { error } = validateStatus(req.body)
		if (error) return res.status(400).send(error.details[0].message)

		const booking = await prismaClient.booking.findUnique({ where: { id } })
		if (!booking) return res.status(404).send("Booking not found")

		const updatedBooking = await prismaClient.booking.update({
			where: { id },
			data: { status: req.body.status.toUpperCase() },
		})

		res.send(updatedBooking)
	},
)

router.patch(
	"/:id/paymentStatus",
	[auth, authorizeRoles(["EMPLOYEE", "ADMIN"])],
	async (req, res) => {
		const { id } = req.params

		const { error } = validatePaymentStatus(req.body)
		if (error) return res.status(400).send(error.details[0].message)

		const booking = await prismaClient.booking.findUnique({ where: { id } })
		if (!booking) return res.status(404).send("Booking not found")

		const updatedBooking = await prismaClient.booking.update({
			where: { id },
			data: { paymentStatus: req.body.status.toUpperCase() },
		})

		res.send(updatedBooking)
	},
)

router.delete("/", [auth, authorizeRoles(["BOOKER", "ADMIN"])], async (req, res) => {
	const deletedBookings = await prismaClient.booking.deleteMany({})

	res.send(`Deleted ${deletedBookings.count} bookings`)
})

module.exports = router
