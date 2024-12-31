const express = require("express")
const app = express()
const config = require("config")

require("./startup/cors")(app)
require("./startup/routes")(app)

const port = config.get("SERVER_PORT")
const server = app.listen(port, () => console.log(`Listening on port ${port}...`))

require("./startup/socket")(server)
