import express from "express";
import bcrypt from "bcrypt";
import { pool } from "../db.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

/**
 * GET /users/me
 * Infos de l'utilisateur connecté
 */
router.get("/me", auth, async (req, res) => {
  const result = await pool.query(
    "SELECT id, name, creationdate FROM users WHERE id = $1",
    [req.userId]
  );

  if (!result.rows.length)
    return res.status(404).json({ error: "Utilisateur introuvable" });

  res.json(result.rows[0]);
});

/**
 * PUT /users/me/name
 * Modifier le nom
 */
router.put("/me/name", auth, async (req, res) => {
  const { name } = req.body;

  if (!name)
    return res.status(400).json({ error: "Nom requis" });

  try {
    const result = await pool.query(
      "UPDATE users SET name = $1 WHERE id = $2 RETURNING id, name",
      [name, req.userId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({
        error: "Ce nom est déjà utilisé"
      });
    }
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * PUT /users/me/password
 * Modifier le mot de passe
 */
router.put("/me/password", auth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword)
    return res.status(400).json({
      error: "Ancien et nouveau mot de passe requis"
    });

  const result = await pool.query(
    "SELECT password FROM users WHERE id = $1",
    [req.userId]
  );

  const user = result.rows[0];
  const valid = await bcrypt.compare(oldPassword, user.password);

  if (!valid)
    return res.status(401).json({ error: "Ancien mot de passe incorrect" });

  const hashed = await bcrypt.hash(newPassword, 10);

  await pool.query(
    "UPDATE users SET password = $1 WHERE id = $2",
    [hashed, req.userId]
  );

  res.json({ message: "Mot de passe mis à jour" });
});

/**
 * GET /users/:id
 * Infos publiques d'un utilisateur
 */
router.get("/:id", async (req, res) => {
  const result = await pool.query(
    "SELECT id, name FROM users WHERE id = $1",
    [req.params.id]
  );

  if (!result.rows.length)
    return res.status(404).json({ error: "Utilisateur introuvable" });

  res.json(result.rows[0]);
});

router.get("/game/:name/me/top", auth, async (req, res) => {
  const { name } = req.params;

  try {
    const gameRes = await pool.query("SELECT id FROM games WHERE name = $1", [name]);
    if (!gameRes.rows.length) return res.status(404).json({ error: "Jeu introuvable" });
    const gameId = gameRes.rows[0].id;

    const rankingRes = await pool.query(
      `
      SELECT user_id, score, duration_ms, rank FROM (
        SELECT user_id, score, duration_ms,
          RANK() OVER(ORDER BY score DESC, duration_ms ASC) AS rank
        FROM game_sessions
        WHERE game_id = $1
      ) r
      ORDER BY rank
      `,
      [gameId]
    );

    const rankings = rankingRes.rows;
    const meIndex = rankings.findIndex(r => r.user_id === req.userId);

    if (meIndex === -1) return res.json([]);

    const start = Math.max(meIndex - 5, 0);
    const end = Math.min(meIndex + 5 + 1, rankings.length);

    const aroundMe = rankings.slice(start, end);

    // Ajouter le nom des joueurs
    const userIds = aroundMe.map(r => r.user_id);
    const usersRes = await pool.query(
      "SELECT id, name FROM users WHERE id = ANY($1)",
      [userIds]
    );

    const usersMap = {};
    usersRes.rows.forEach(u => { usersMap[u.id] = u.name; });

    const final = aroundMe.map(r => ({
      ...r,
      name: usersMap[r.user_id] || "Inconnu"
    }));

    res.json(final);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
