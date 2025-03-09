const joi = require("joi")

function getJoiSchema() {
	return joi.object({
		vehicleId: joi.string().uuid().required().label("Vehicle ID"),
		startLocation: joi.string().required().label("Starting Location"),
		endLocation: joi.string().required().label("Ending Location"),
		startDate: joi.date().iso().required().label("Starting Date"),
		endDate: joi.date().iso().min(joi.ref("startDate")).required().label("Ending Date"),
		paymentMode: joi.string().required().label("Payment Mode")
	})
}

function validateBooking(booking) {
	return getJoiSchema().validate(booking)
}

function validateStatus(status) {
	return joi
		.object({
			status: joi
				.string()
				.valid("PENDING", "IN_PROGRESS", "ACCEPTED", "COMPLETED", "CANCELLED")
				.required()
				.label("Availability Status"),
		})
		.validate(status)
}

function validatePaymentStatus(status) {
	return joi
		.object({
			status: joi
				.string()
				.valid("PENDING", "PAID", "FAILED")
				.required()
				.label("Availability Status"),
		})
		.validate(status)
}

exports.validateBooking = validateBooking
exports.validateStatus = validateStatus
exports.validatePaymentStatus = validatePaymentStatus
