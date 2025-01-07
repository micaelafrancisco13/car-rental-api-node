const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

process.on("SIGINT", async () => {
	console.log("Shutting down Prisma...")
	await prisma.$disconnect()
	process.exit(0)
})

module.exports.prismaClient = prisma
