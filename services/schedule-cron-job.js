const cron = require("node-cron")

function scheduleCronJob(cronExpression, task, taskName) {
	cron.schedule(cronExpression, async () => {
		try {
			await task()
		} catch (exception) {
			console.error(`Error running scheduled task: ${taskName}`)
			console.error(exception.message)
		}
	})
}

module.exports.scheduleCronJob = scheduleCronJob
