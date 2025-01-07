const { initSocket } = require("../services/socket")

module.exports = function (server) {
	initSocket(server)
}
