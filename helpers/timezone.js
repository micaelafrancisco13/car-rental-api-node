const { parse, addHours, format } = require("date-fns")
const { BOOKING_STATUS_CHANGE_TIME } = require("./constants")

class TimezoneService {
	static getUtcTime() {
		const manilaDate = parse(BOOKING_STATUS_CHANGE_TIME, "h:mm a", new Date()) // Parse to a Date object in Manila timezone

		const utcDate = addHours(manilaDate, -8)
		const utcHour = format(utcDate, "H")
		const utcMinute = format(utcDate, "m")

		return { hour: utcHour, minute: utcMinute }
	}
}

module.exports.TimezoneService = TimezoneService
