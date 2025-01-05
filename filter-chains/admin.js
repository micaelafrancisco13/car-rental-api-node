module.exports = function (req, res, next) {
	if (process.env.REQUIRES_AUTH !== "true") return next()

	// get req.user from auth middleware, the previous
	// middleware
	if (req.user.role !== "ADMIN") return res.status(403).send("Access denied.")

	next()
}

// 400 bad request - invalid JSON request
// 401 unauthorized - no credential or invalid credential
// 403 unauthorized - valid credential but not enough privileges
