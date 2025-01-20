const { parse, addHours } = require("date-fns")

class TimezoneService {
	static getUtcDate(inputTime) {
		return addHours(parse(inputTime, "h:mm a", new Date()), -8)
	}
}

module.exports.TimezoneService = TimezoneService
