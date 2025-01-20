const { scheduleCronJob } = require("../services/schedule-cron-job")
const { updateBookingStatus } = require("../helpers/booking")
const { BOOKING_STATUS_CHANGE_TIME } = require("../helpers/constants")
const { CronJobService } = require("../helpers/cron-job")

module.exports = function () {
	scheduleCronJob(
		CronJobService.getCronExpression(BOOKING_STATUS_CHANGE_TIME),
		updateBookingStatus,
		"Test cron job",
	)
}
