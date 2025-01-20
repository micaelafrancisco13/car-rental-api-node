const joi = require("joi")

function getJoiSchema() {
	return joi.object({
		vehicleId: joi.string().uuid().required().label("Vehicle ID"),
		startLocation: joi.string().required().label("Starting Location"),
		endLocation: joi.string().required().label("Ending Location"),
		startDate: joi.date().iso().required().label("Starting Date"),
		endDate: joi.date().iso().min(joi.ref("startDate")).required().label("Ending Date"),
	})
}

function validateBooking(booking) {
	return getJoiSchema().validate(booking)
}

exports.validateBooking = validateBooking
