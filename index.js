const express = require("express")
const app = express()

require("./startup/cors")(app)
require("./startup/routes")(app)

const port = process.env.SERVER_PORT
const server = app.listen(port, () => console.log(`Listening on port ${port}...`))

require("./startup/socket")(server)
