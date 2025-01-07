const { TimezoneService } = require("./timezone")
const { format } = require("date-fns")

class CronJobService {
	static getCronExpression(localTime) {
		// 	This Cron expression 22 13 * * * breaks down as follows:
		// 	22: Minute (22)
		// 	13: Hour (13, which is 1 PM in 24-hour format)
		// * * *: Run every day of the week, every month, every year

		const utcDate = TimezoneService.getUtcDate(localTime)
		const utcHour = format(utcDate, "H")
		const utcMinute = format(utcDate, "m")

		return `${utcMinute} ${utcHour} * * *`
	}
}

module.exports.CronJobService = CronJobService
