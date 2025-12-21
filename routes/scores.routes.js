import express from "express";
import { pool } from "../db.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

router.post("/", auth, async (req, res) => {
  const { game_id, score, duration_ms, finished } = req.body;

  const result = await pool.query(
    `INSERT INTO game_sessions
     (user_id, game_id, score, duration_ms, finished)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING *`,
    [req.userId, game_id, score, duration_ms, finished ?? true]
  );

  res.json(result.rows[0]);
});


// Top 10 d'un jeu
router.get("/game/:name/top", async (req, res) => {
  const { name } = req.params;
  const limit = parseInt(req.query.limit) || 10;

  try {
    const gameRes = await pool.query(
      "SELECT id FROM games WHERE LOWER(name) = LOWER($1)",
      [name]
    );
    if (!gameRes.rows.length)
      return res.status(404).json({ error: "Jeu introuvable" });

    const gameId = gameRes.rows[0].id;

    const result = await pool.query(
      `
      SELECT DISTINCT ON (u.id)
        u.id AS user_id,
        u.name,
        gs.score,
        gs.duration_ms,
        gs.played_at
      FROM game_sessions gs
      JOIN users u ON u.id = gs.user_id
      WHERE gs.game_id = $1
      ORDER BY u.id, gs.score DESC, gs.duration_ms ASC
      LIMIT $2
      `,
      [gameId, limit]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.get("/game/:gameId/me", auth, async (req, res) => {
  const { gameId } = req.params;

  const result = await pool.query(
    `
    SELECT rank FROM (
      SELECT user_id,
      RANK() OVER (ORDER BY score DESC, duration_ms ASC) AS rank
      FROM game_sessions
      WHERE game_id = $1
    ) r
    WHERE user_id = $2
    `,
    [gameId, req.userId]
  );

  if (!result.rows.length)
    return res.json({ rank: null });

  res.json(result.rows[0]);
});


export default router;
