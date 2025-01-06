const { parseISO, differenceInDays } = require("date-fns")
const { isPointWithinRadius } = require("geolib")

// Constants for fees and configurations
const {
	DROPOFF_FEE,
	PLATFORM_FEE,
	ANGELES_CITY_CENTER,
	DELIVERY_RADIUS_METERS,
} = require("./constants")

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

	// Constructor to initialize booking details
	constructor(dailyRate, startDate, endDate, latitude, longitude) {
		this.dailyRate = dailyRate
		this.startDate = startDate
		this.endDate = endDate
		this.latitude = latitude
		this.longitude = longitude
		this.deliveryType = this.#determineDeliveryType()
	}

	// Private method to calculate the difference in days between two UTC dates
	#getUtcDateDifferenceInDays() {
		return differenceInDays(parseISO(this.startDate), parseISO(this.endDate))
	}

	// Private method to check if coordinates are within Angeles City
	#isWithinAngeles() {
		// Convert coordinates to numbers before using them in isPointWithinRadius
		const userLatitude = parseFloat(this.latitude)
		const userLongitude = parseFloat(this.longitude)

		return isPointWithinRadius(
			{ latitude: userLatitude, longitude: userLongitude },
			this.center,
			this.deliveryRadius,
		)
	}

	// Public method to determine the delivery type based on location
	#determineDeliveryType() {
		return this.#isWithinAngeles() ? "DROPOFF" : "PICKUP"
	}

	getDeliveryType() {
		return this.deliveryType
	}

	// Public method to calculate the total price of a booking
	calculateTotalPrice() {
		const rentalDays = this.#getUtcDateDifferenceInDays()
		const basePrice = this.dailyRate * rentalDays
		const dropoffFee = this.deliveryType === "DROPOFF" ? this.dropoffFee : 0
		return basePrice + dropoffFee + this.platformFee
	}
}

module.exports = BookingService
