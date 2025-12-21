import express from "express";
import { pool } from "../db.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// Créer un jeu
router.post("/", auth, async (req, res) => {
  const { name, score_order, time_used } = req.body;

  const result = await pool.query(
    `INSERT INTO games (name, score_order, time_used)
     VALUES ($1,$2,$3) RETURNING *`,
    [name, score_order, time_used]
  );

  res.json(result.rows[0]);
});

// Liste des jeux
router.get("/", async (req, res) => {
  const result = await pool.query("SELECT * FROM games");
  res.json(result.rows);
});

export default router;
