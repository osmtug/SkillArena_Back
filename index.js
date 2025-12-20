import express from "express";
import cors from "cors";
import pkg from "pg";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", async (req, res) => {
  const result = await pool.query("SELECT NOW()");
  res.json(result.rows);
});

app.get("/users", async (req, res) => {
  const users = await pool.query("SELECT id, name FROM user");
  res.json(users.rows);
});



app.post("/register", async (req, res) => {
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({ error: "Nom et mot de passe requis" });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (name, password) VALUES ($1, $2) RETURNING id, name",
      [name, hashed]
    );

    const user = result.rows[0];

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, user });
  } catch (err) {
    console.error(err);

    if (err.code === "23505") {
      return res.status(400).json({
        error: "Ce nom d’utilisateur est déjà utilisé"
      });
    }

    res.status(500).json({ error: "Erreur serveur" });
  }
});


import jwt from "jsonwebtoken";

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const result = await pool.query(
    "SELECT * FROM users WHERE name = $1",
    [email]
  );

  if (result.rows.length === 0)
    return res.status(401).json({ error: "Utilisateur introuvable" });

  const user = result.rows[0];
  const valid = await bcrypt.compare(password, user.password);

  if (!valid)
    return res.status(401).json({ error: err.message });

  const token = jwt.sign(
    { id: user.id },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.json({ token });
});

app.get("/debug-db", async (req, res) => {
  const result = await pool.query("SELECT current_database()");
  res.json(result.rows);
});



app.listen(3000, () => console.log("Server OK"));
