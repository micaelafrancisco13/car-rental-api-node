const cors = require("cors")

module.exports = function (app) {
	app.use(
		cors({
			origin: [`http://localhost:${process.env.UI_CLIENT_PORT}`, 'https://car-rental-ui-react.vercel.app'],
		}),
	)
}
