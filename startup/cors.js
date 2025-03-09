const cors = require("cors")

module.exports = function (app) {
	app.use(
		cors({
			origin: [process.env.UI_CLIENT_URL, "http://localhost:5173", "https://www.biboyvehiclerental.site","biboyvehiclerental.site"],
		}),
	)
}
