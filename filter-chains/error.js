module.exports = function (error, req, res) {
	//log the exception
	console.error(error)
	res.status(500).send("Something failed in the server.")
}
