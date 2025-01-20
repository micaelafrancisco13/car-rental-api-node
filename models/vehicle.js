const joi = require("joi")

function getJoiSchema() {
	return joi.object({
		make: joi.string().min(2).max(50).required().label("Make"),
		model: joi.string().min(2).max(50).required().label("Model"),
		year: joi
			.number()
			.integer()
			.min(1900)
			.max(new Date().getFullYear() + 1)
			.required()
			.label("Year"),
		licensePlate: joi.string().min(2).max(50).required().label("License Plate"),
		dailyRate: joi.number().positive().precision(2).required().label("Daily Rate"),
		briefDescription: joi.string().min(2).max(50).label("Brief Description"),
		detailedDescription: joi.string().min(2).max(1000).label("Detailed Description"),
		features: joi
			.array()
			.items(joi.string().min(2).max(50))
			.min(1)
			.max(5)
			.required()
			.label("Features"),
		images: joi.array().items(joi.string().uri()).min(1).max(5).required().label("Images"),
	})
}

function validateVehicle(vehicle) {
	return getJoiSchema().validate(vehicle)
}

function validateModifiedVehicle(data) {
	return joi
		.object({
			id: joi.string().uuid().required().label("Vehicle ID"),
			vehicle: getJoiSchema().required().label("Vehicle"),
		})
		.validate(data)
}

function validateAvailabilityStatus(availabilityStatus) {
	return joi
		.object({
			availabilityStatus: joi
				.string()
				.valid("AVAILABLE", "BOOKED", "MAINTENANCE")
				.required()
				.label("Availability Status"),
		})
		.validate(availabilityStatus)
}

exports.validateVehicle = validateVehicle
exports.validateModifiedVehicle = validateModifiedVehicle
exports.validateAvailabilityStatus = validateAvailabilityStatus
