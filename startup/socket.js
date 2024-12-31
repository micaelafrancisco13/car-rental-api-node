const { initSocket } = require("../socket")

module.exports = function (server) {
	initSocket(server)
}
