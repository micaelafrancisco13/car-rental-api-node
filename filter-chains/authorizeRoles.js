function authorizeRoles(allowedRoles) {
	return function (req, res, next) {
		if (process.env.REQUIRES_AUTH !== "true") return next()

		// Check if the user's role is in the list of allowed roles
		if (!allowedRoles.includes(req.user.role)) return res.status(403).send("Access denied.")

		next()
	}
}

module.exports = authorizeRoles
