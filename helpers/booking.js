const { parseISO, differenceInDays } = require("date-fns")
const { isPointWithinRadius } = require("geolib")

const {
	DROPOFF_FEE,
	PLATFORM_FEE,
	ANGELES_CITY_CENTER,
	DELIVERY_RADIUS_METERS,
} = require("./constants")
const { prismaClient } = require("../startup/database")

class BookingService {
	dailyRate
	startDate
	endDate
	latitude
	longitude
	dropoffFee = DROPOFF_FEE
	platformFee = PLATFORM_FEE
	center = ANGELES_CITY_CENTER
	deliveryRadius = DELIVERY_RADIUS_METERS
	deliveryType

	constructor(dailyRate, startDate, endDate, latitude, longitude) {
		this.dailyRate = dailyRate
		this.startDate = startDate
		this.endDate = endDate
		this.latitude = latitude
		this.longitude = longitude
		this.deliveryType = this.#determineDeliveryType()
	}

	static async updateBookingStatus() {
		const currentUtcDate = new Date().toISOString() // Converts to ISO format (UTC)
		console.log("Updating booking status...", currentUtcDate)
		try {
			const bookingsToUpdate = await prismaClient.booking.findMany({
				where: {
					status: { in: ["PENDING", "ACCEPTED"] },
					startDate: currentUtcDate,
				},
			})

			for (const booking of bookingsToUpdate) {
				await prismaClient.booking.update({
					where: { id: booking.id },
					data: { status: "IN_PROGRESS" },
				})
			}

			console.log(`Successfully updated ${bookingsToUpdate.length} bookings to IN_PROGRESS.`)
		} catch (error) {
			console.error("Error updating booking statuses:", error)
		} finally {
			await prismaClient.$disconnect()
		}
	}

	#getUtcDateDifferenceInDays() {
		return differenceInDays(parseISO(this.startDate), parseISO(this.endDate))
	}

	#isWithinAngeles() {
		const userLatitude = parseFloat(this.latitude)
		const userLongitude = parseFloat(this.longitude)

		return isPointWithinRadius(
			{ latitude: userLatitude, longitude: userLongitude },
			this.center,
			this.deliveryRadius,
		)
	}

	#determineDeliveryType() {
		return this.#isWithinAngeles() ? "DROPOFF" : "PICKUP"
	}

	getDeliveryType() {
		return this.deliveryType
	}

	calculateTotalPrice() {
		const rentalDays = this.#getUtcDateDifferenceInDays()
		const basePrice = this.dailyRate * rentalDays
		const dropoffFee = this.deliveryType === "DROPOFF" ? this.dropoffFee : 0
		return basePrice + dropoffFee + this.platformFee
	}

	async checkVehicleAvailability(vehicleId, index) {
		const existingBookings = await prismaClient.booking.findMany({
			where: {
				vehicleId: vehicleId,
				status: { in: ["PENDING", "ACCEPTED", "IN_PROGRESS"] },
				OR: [
					{
						startDate: { lte: this.endDate },
						endDate: { gte: this.startDate },
					},
					{
						startDate: { lte: this.startDate },
						endDate: { gte: this.endDate },
					},
				],
			},
		})

		if (existingBookings?.length > 0) {
			throw new Error(
				`The vehicle at index ${index} is already booked for the selected dates`,
			)
		}

		return true
	}
}

module.exports = BookingService
