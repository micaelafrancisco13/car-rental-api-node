const jwt = require("jsonwebtoken")

module.exports = function (req, res, next) {
	if (process.env.REQUIRES_AUTH !== "true") return next()

	let token = req.header("Authorization")
	if (!token || !token.startsWith("Bearer "))
		return res.status(401).send("Access denied. No token provided.")

	token = token.substring(7)

	try {
		req.user = jwt.verify(token, process.env.JWT_PRIVATE_KEY)
		next()
	} catch (ex) {
		console.error(ex)
		res.status(400).send("Invalid token.")
	}
}
