const { Server } = require("socket.io")
const { initialize, handleSendData } = require("./SocketEventHandler")

let io

const initSocket = (server) => {
	console.log("Creating Socket.io server...")
	io = new Server(server, {
		cors: {
			origin: "*",
			methods: ["GET", "POST"],
		},
	})

	io.on("connection", (socket) => {
		console.log("A client connected:", socket.id)

		initialize(io)
		handleSendData(socket)

		socket.on("disconnect", () => {
			console.log("Client disconnected:", socket.id)
		})
	})
}

module.exports = { initSocket }
