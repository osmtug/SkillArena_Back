import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import gameRoutes from "./routes/games.routes.js";
import scoreRoutes from "./routes/scores.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "API OK" });
});

app.use("/auth", authRoutes);
app.use("/games", gameRoutes);
app.use("/scores", scoreRoutes);

export default app;
