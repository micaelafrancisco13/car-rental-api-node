const { TimezoneService } = require("../helpers/timezone")
const { scheduleCronJob } = require("../services/schedule-cron-job")
const { updateBookingStatus } = require("../helpers/booking")

module.exports = function () {
	const { hour, minute } = TimezoneService.getUtcTime()

	const cronExpression = `${minute} ${hour} * * *`
	scheduleCronJob(cronExpression, updateBookingStatus, "Test cron job")
	// Add more cron jobs here using the scheduleCronJob function
	// Example:
	// scheduleCronJob("*/5 * * * *", someOtherTask); // Run someOtherTask every 5 minutes
}
