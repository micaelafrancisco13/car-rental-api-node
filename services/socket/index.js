const { Server } = require("socket.io")
const { initialize, handleSendData } = require("./SocketEventHandler")
const { prismaClient } = require("../../startup/database")

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

		socket.on('updateLocation', async (data) => {
			const { bookingId, latitude, longitude, speed, tripStatus } = data;
			
			let drivingDuration = 0;
			// Update the FleetTracking table with the new location
			
			const currentTrip = await prismaClient.fleetTracking.findUnique({
			  where: { bookingId }
			});
		  
			if (currentTrip) {
			  const now = new Date();
			  const lastUpdatedAt = currentTrip.lastUpdatedAt;
		  
			  if (currentTrip.tripStatus === "IDLE" && tripStatus === "ON_TRIP") {
				drivingDuration = 0;
			  } else if (currentTrip.tripStatus === "ON_TRIP" && tripStatus === "ON_TRIP") {
				drivingDuration = Math.floor((now.getTime() - lastUpdatedAt.getTime()) / 1000);
			  }
			}

			await prismaClient.fleetTracking.upsert({
			  where: { bookingId },
			  update: { bookerLatitude: latitude, bookerLongitude: longitude, speed, lastUpdatedAt: new Date(), tripStatus },
			  create: { bookingId, bookerLatitude: latitude, bookerLongitude: longitude, speed, tripStatus: 'ON_TRIP' }
			});

			if (!currentTrip || currentTrip.tripStatus !== tripStatus) {
			  const newTripHistory = await prismaClient.tripHistory.create({
				data: {
				  booking: { connect: { id: bookingId } },
				  latitude,
				  longitude,
				  speed,
				  tripStatus,
				  drivingDuration,
				},
			  });
		  
			  // Store the location point
			  await prismaClient.location.create({
				data: {
				  tripHistoryId: newTripHistory.id,
				  latitude,
				  longitude,
				},
			  });
			} else {
			  // Store the location point for the current trip
			  const currentTripHistory = await prismaClient.tripHistory.findFirst({
				where: { bookingId, tripStatus: 'ON_TRIP' },
				orderBy: { recordedAt: 'desc' },
			  });

			  if (currentTripHistory) {
				await prismaClient.location.create({
				  data: {
					tripHistoryId: currentTripHistory.id,
					latitude,
					longitude,
				  },
				});
			  }
			}
		  
			// Emit the updated location to all admins
			io.emit('locationUpdated', { bookingId, latitude, longitude, speed, tripStatus, drivingDuration });
		  });

		socket.on("disconnect", () => {
			console.log("Client disconnected:", socket.id)
		})
	})
}

module.exports = { initSocket }
