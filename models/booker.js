const joi = require("joi")
const jwt = require("jsonwebtoken")

function generateAuthToken(booker) {
	return jwt.sign(
		{
			bookerId: booker.id,
			userId: booker.userId,
			firstName: booker.firstName,
			lastName: booker.lastName,
			email: booker.email,
			phoneNumber: booker.phoneNumber,
			role: booker.role,
		},
		process.env.JWT_PRIVATE_KEY,
	)
}

function getJoiSchema() {
	return joi.object({
		userId: joi.string().uuid().required().label("User ID"),
	})
}

function validateBooker(booker) {
	return getJoiSchema().validate(booker)
}

exports.validateBooker = validateBooker
exports.generateBookerAuthToken = generateAuthToken
