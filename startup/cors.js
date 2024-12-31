const cors = require("cors")
const config = require("config")

module.exports = function (app) {
	app.use(
		cors({
			origin: [`http://localhost:${config.get("UI_CLIENT_PORT")}`],
		}),
	)
}
