require("dotenv").config();

const cors = require("cors");
const express = require("express");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
const port = process.env.PORT || 3000;
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
	.split(",")
	.map((origin) => origin.trim())
	.map((origin) => origin.replace(/\/+$/, ""))
	.filter(Boolean);

app.use(
	cors({
		origin(origin, callback) {
			if (!origin || allowedOrigins.includes(origin)) {
				return callback(null, true);
			}

			return callback(new Error("Origin is not allowed by CORS."));
		},
	}),
);
app.use(helmet());
app.use(express.json());

const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 10,
	standardHeaders: "draft-8",
	legacyHeaders: false,
	message: { message: "Too many authentication attempts. Try again later." },
});

app.get("/api/health", (request, response) => {
	response.json({ ok: true });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/admin", adminRoutes);

if (require.main === module) {
	app.listen(port, "0.0.0.0", () => {
		console.log(`Alpha Admin API listening on port ${port}`);
	});
}

module.exports = app;