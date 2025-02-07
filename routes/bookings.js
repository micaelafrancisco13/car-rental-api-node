const auth = require("../filter-chains/auth")
const express = require("express")
const authorizeRoles = require("../filter-chains/authorizeRoles")
const { validateBooking, validateStatus, validatePaymentStatus } = require("../models/booking")
const BookingService = require("../helpers/booking")
const { prismaClient } = require("../startup/database")
const { DEFAULT_SORT_BY, DEFAULT_ORDER } = require("../helpers/constants")
const router = express.Router()

const { startOfWeek, startOfMonth, startOfYear, format, parseISO } = require("date-fns")
const buildBookingFilter = (query, user) => {
	const filter = {}
	if (query.bookerId || user.role === "BOOKER") filter.bookerId = user.bookerId
	if (query.vehicleId) filter.vehicleId = query.vehicleId
	if (query.status) filter.status = query.status
	if (query.paymentStatus) filter.paymentStatus = query.paymentStatus
	if (query.deliveryType) filter.deliveryType = query.deliveryType
	if (query.startDate && query.endDate) {
		filter.startDate = { gte: new Date(query.startDate) }
		filter.endDate = { lte: new Date(query.endDate) }
	}

	if (user.role !== "BOOKER") {
		filter.status = { not: "CANCELLED" };
	}
	return filter
}

router.get("/dashboard", async (req, res) => {
	const interval = req.params.interval || "month"
	const vehicleCount = await prismaClient.vehicle.groupBy({
		by: ["availabilityStatus"],
		_count: {
			id: true,
		},
	})

	const bookingStatusCount = await prismaClient.booking.groupBy({
		by: ["status"],
		_count: {
			id: true,
		},
	})

	const bookingPaymentStatusCount = await prismaClient.booking.groupBy({
		by: ["paymentStatus"],
		_count: {
			id: true,
		},
	})
	let dateGroupFormat
	let startDate

	const today = new Date()

    switch (interval) {
      case "week":
        startDate = startOfWeek(today); 
        dateGroupFormat = "yyyy-ww"; 
        break;
      case "month":
        startDate = startOfMonth(today); 
        dateGroupFormat = "Month"; 
        break;
      case "year":
        startDate = startOfYear(today); 
        dateGroupFormat = "yyyy"; 
        break;
      default:
        throw new Error("Invalid interval type");
    }


	const result = await prismaClient.$queryRaw`
	SELECT 
	  TO_CHAR("endDate", ${dateGroupFormat}) AS "formattedEndDate", -- Format endDate dynamically
	  SUM("totalPrice") AS "totalPrice"
	FROM "Booking"
	WHERE "status" = 'COMPLETED'
	  AND "endDate" >= ${startDate} -- Filter by start date
	GROUP BY "formattedEndDate"
	ORDER BY "formattedEndDate";
  `;

	const count = {
		vehicleCount,
		bookingStatusCount,
		bookingPaymentStatusCount,
		// formattedData,
		result,
	}

	res.send(count)
})

router.get("/", [auth, authorizeRoles(["BOOKER", "ADMIN", "EMPLOYEE"])], async (req, res) => {
	const filter = buildBookingFilter(req.query, req.user)

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
		// status: {
		// 	notIn: ["CANCELLED", "COMPLETED"],
		// },
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

router.get("/:id", [auth, authorizeRoles(["ADMIN"])], async (req, res) => {
	const { id } = req.params

	const bookings = await prismaClient.booking.findMany({
		where: { id },
		include: {
			vehicle: true,
			booker: true,
			fleetTracking:true,
			tripHistory: true
		},
	})

	res.send(bookings)
})

router.post("/", [auth, authorizeRoles(["BOOKER", "EMPLOYEE", "ADMIN"])], async (req, res) => {
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
						startDate: parseISO(startDate),
						endDate: parseISO(endDate),
						balance: bookingService.calculateTotalPrice(),
						totalPrice: bookingService.calculateTotalPrice(),
						status: "IN_PROGRESS",
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
	[auth, authorizeRoles(["BOOKER", "EMPLOYEE", "ADMIN"])],
	async (req, res) => {
		const { id } = req.params

		const { error } = validateStatus(req.body)
		if (error) return res.status(400).send(error.details[0].message)

		const booking = await prismaClient.booking.findUnique({ where: { id } })
		if (!booking) return res.status(404).send("Booking not found")

		const updatedBooking = await prismaClient.booking.update({
			where: { id },
			data: { 
				startDate: booking.startDate,
				endDate: booking.endDate,
				status: req.body.status.toUpperCase() },
			include: {
				booker: true,
				vehicle: true,
			}
		})
		let vehicleStatus
		if (req.body.status === "IN_PROGRESS" || req.body.status === "RESERVED") {
			vehicleStatus = "BOOKED"
		} else if (req.body.status === "COMPLETED" || req.body.status === "CANCELLED") {
			vehicleStatus = "AVAILABLE"
		}

		if (vehicleStatus) {
			await prismaClient.vehicle.update({
				where: { id:booking.vehicleId },
				data: { availabilityStatus: vehicleStatus },
			})
		}
		res.send(updatedBooking)
	},
)

router.patch(
	"/:id",
	[auth, authorizeRoles(["BOOKER","EMPLOYEE", "ADMIN"])],
	async (req, res) => {
		const { id } = req.params

		const booking = await prismaClient.booking.findUnique({ where: { id } })
		if (!booking) return res.status(404).send("Booking not found")

		const balance = booking.balance - req.body.depositPaid
		const { startDate, endDate } = req.body.booking
		const updatedBooking = await prismaClient.booking.update({
			where: { id },
			data: { 
				startDate: parseISO(startDate),
				endDate: parseISO(endDate),
				depositPaid: req.body.depositPaid,
				balance: balance,
				paymentStatus: balance === 0 ? "PAID" : "PENDING" },
			include: {
				booker: true,
				vehicle: true,
			}
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
			data: { 
				startDate: booking.startDate,
				endDate: booking.endDate,
				paymentStatus: req.body.status.toUpperCase() },
			include: {
				booker: true,
				vehicle: true,
			}
		})

		res.send(updatedBooking)
	},
)

router.delete("/", [auth, authorizeRoles(["BOOKER", "ADMIN"])], async (req, res) => {
	const deletedBookings = await prismaClient.booking.deleteMany({})

	res.send(`Deleted ${deletedBookings.count} bookings`)
})

module.exports = router
