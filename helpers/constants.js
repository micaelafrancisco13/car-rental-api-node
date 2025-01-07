// constants.js
const DROPOFF_FEE = 100.0
const PLATFORM_FEE = 75.0

// Define Angeles City coordinates as the center and a radius (e.g., 10 km)
const ANGELES_CITY_CENTER = {
	latitude: 15.146614311801677,
	longitude: 120.58844064892259,
}
const DELIVERY_RADIUS_METERS = 10000 // 10 km

const BOOKING_STATUS_CHANGE_TIME = "3:00 AM"

module.exports = {
	DROPOFF_FEE,
	PLATFORM_FEE,
	ANGELES_CITY_CENTER,
	DELIVERY_RADIUS_METERS,
	BOOKING_STATUS_CHANGE_TIME,
}
