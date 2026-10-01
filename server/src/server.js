require("dotenv").config();

const { randomUUID } = require("node:crypto");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const express = require("express");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const publicRoutes = require("./routes/publicRoutes");
const internalRoutes = require("./routes/internalRoutes");
const { apiErrorHandler } = require("./middleware/apiErrorHandler");

const app = express();
const port = process.env.PORT || 3000;

const allowedOrigins = [
	...(process.env.FRONTEND_URL || "http://localhost:5173").split(","),
]
	.map((origin) => origin.trim())
	.map((origin) => origin.replace(/\/+$/, ""))
	.filter(Boolean);

app.use((request, response, next) => {
	request.requestId = randomUUID();
	response.setHeader("X-Request-Id", request.requestId);
	next();
});

app.use(
	cors({
		origin(origin, callback) {
			if (!origin || allowedOrigins.includes(origin)) {
				return callback(null, true);
			}

			return callback(new Error("Origin is not allowed by CORS."));
		},
		credentials: true,
	}),
);
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

app.get("/", (request, response) => {
	response.json({ name: "Alpha Admin API", ok: true });
});

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
app.use("/api/public", publicRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/internal", internalRoutes);
app.use((request, response, next) => {
	const error = new Error("The requested API endpoint was not found.");
	error.statusCode = 404;
	error.code = "NOT_FOUND";
	next(error);
});
app.use(apiErrorHandler);

if (require.main === module) {
	app.listen(port, "0.0.0.0", () => {
		console.log(`Alpha Admin API listening on port ${port}`);
	});
}

module.exports = app;