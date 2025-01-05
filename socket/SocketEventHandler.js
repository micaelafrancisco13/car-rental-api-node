class SocketEventHandler {
	static io

	static initialize(ioInstance) {
		this.io = ioInstance
	}

	static handleSendData(socket) {
		socket.on("send-data", (data) => {
			console.log("send-data event received:", data)

			// Emit data back to clients
			this.io.emit(
				"receive-data",
				`Hello socket client! This is what you sent me: ${data}`,
			)
		})
	}
}

module.exports = SocketEventHandler
