import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("focus_kar.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    onboarding_completed INTEGER DEFAULT 0,
    accessibility_granted INTEGER DEFAULT 0,
    notifications_granted INTEGER DEFAULT 0,
    streak_count INTEGER DEFAULT 0,
    last_focus_date TEXT,
    streak_freeze_used_this_week INTEGER DEFAULT 0,
    last_freeze_reset_date TEXT,
    focus_coins INTEGER DEFAULT 0,
    emergency_unlocks_today INTEGER DEFAULT 0,
    last_unlock_date TEXT,
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS focus_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    start_time TEXT,
    duration_minutes INTEGER,
    completed INTEGER DEFAULT 0,
    tree_type TEXT,
    coins_earned INTEGER DEFAULT 0,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS unlocked_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    item_type TEXT, -- 'tree', 'theme', 'avatar'
    item_id TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS blocked_sites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    domain TEXT UNIQUE,
    is_custom INTEGER DEFAULT 0,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS blocked_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    domain TEXT,
    timestamp TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT,
    category TEXT, -- 'study', 'work', 'other'
    duration_minutes INTEGER,
    completed INTEGER DEFAULT 0,
    created_at TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Robust column addition
const tableInfo = db.prepare("PRAGMA table_info(users)").all() as any[];
const columns = tableInfo.map(c => c.name);

if (!columns.includes("porn_blocker_enabled")) {
  db.exec("ALTER TABLE users ADD COLUMN porn_blocker_enabled INTEGER DEFAULT 0");
}
if (!columns.includes("strict_porn_blocker")) {
  db.exec("ALTER TABLE users ADD COLUMN strict_porn_blocker INTEGER DEFAULT 0");
}
if (!columns.includes("porn_blocker_pin")) {
  db.exec("ALTER TABLE users ADD COLUMN porn_blocker_pin TEXT");
}
if (!columns.includes("theme")) {
  db.exec("ALTER TABLE users ADD COLUMN theme TEXT DEFAULT 'classic'");
}

db.exec(`
  INSERT OR IGNORE INTO users (id, onboarding_completed, focus_coins) VALUES (1, 0, 0);
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/user", (req, res) => {
    let user = db.prepare("SELECT * FROM users WHERE id = 1").get() as any;
    
    // Check for streak reset
    const today = new Date().toISOString().split('T')[0];
    const yesterday = getYesterday();
    
    if (user.last_focus_date && user.last_focus_date !== today && user.last_focus_date !== yesterday) {
      db.prepare("UPDATE users SET streak_count = 0 WHERE id = 1").run();
      user.streak_count = 0;
    }

    // Reset emergency unlocks daily
    if (user.last_unlock_date !== today) {
      db.prepare("UPDATE users SET emergency_unlocks_today = 0, last_unlock_date = ? WHERE id = 1").run(today);
      user.emergency_unlocks_today = 0;
    }
    
    res.json(user);
  });

  app.post("/api/user/update-porn-blocker", (req, res) => {
    const { enabled, strict, pin } = req.body;
    db.prepare(`
      UPDATE users 
      SET porn_blocker_enabled = ?, 
          strict_porn_blocker = ?, 
          porn_blocker_pin = ? 
      WHERE id = 1
    `).run(enabled ? 1 : 0, strict ? 1 : 0, pin || null);
    res.json({ success: true });
  });

  app.get("/api/blocked-sites", (req, res) => {
    const sites = db.prepare("SELECT * FROM blocked_sites WHERE user_id = 1").all();
    res.json(sites);
  });

  app.post("/api/blocked-sites/add", (req, res) => {
    const { domain } = req.body;
    try {
      db.prepare("INSERT INTO blocked_sites (user_id, domain, is_custom) VALUES (1, ?, 1)").run(domain);
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: "Site already blocked" });
    }
  });

  app.get("/api/blocked-attempts/stats", (req, res) => {
    const stats = db.prepare(`
      SELECT domain, COUNT(*) as count 
      FROM blocked_attempts 
      WHERE user_id = 1 
      GROUP BY domain 
      ORDER BY count DESC 
      LIMIT 5
    `).all();
    const total = db.prepare("SELECT COUNT(*) as total FROM blocked_attempts WHERE user_id = 1").get() as any;
    res.json({ stats, total: total.total });
  });

  app.post("/api/blocked-attempts/log", (req, res) => {
    const { domain } = req.body;
    db.prepare("INSERT INTO blocked_attempts (user_id, domain, timestamp) VALUES (1, ?, ?)")
      .run(domain, new Date().toISOString());
    res.json({ success: true });
  });

  app.get("/api/tasks", (req, res) => {
    const tasks = db.prepare("SELECT * FROM tasks WHERE user_id = 1 ORDER BY created_at DESC").all();
    res.json(tasks);
  });

  app.post("/api/tasks/add", (req, res) => {
    const { title, category, duration_minutes } = req.body;
    const result = db.prepare("INSERT INTO tasks (user_id, title, category, duration_minutes, created_at) VALUES (1, ?, ?, ?, ?)")
      .run(title, category || 'other', duration_minutes || 0, new Date().toISOString());
    res.json({ id: result.lastInsertRowid });
  });

  app.post("/api/tasks/complete", (req, res) => {
    const { task_id } = req.body;
    db.prepare("UPDATE tasks SET completed = 1 WHERE id = ?").run(task_id);
    res.json({ success: true });
  });

  app.post("/api/tasks/delete", (req, res) => {
    const { task_id } = req.body;
    db.prepare("DELETE FROM tasks WHERE id = ?").run(task_id);
    res.json({ success: true });
  });

  app.get("/api/sessions", (req, res) => {
    const sessions = db.prepare("SELECT * FROM focus_sessions WHERE user_id = 1 ORDER BY start_time DESC LIMIT 10").all();
    res.json(sessions);
  });

  app.post("/api/user/update-permissions", (req, res) => {
    const { accessibility_granted } = req.body;
    db.prepare("UPDATE users SET accessibility_granted = ? WHERE id = 1").run(accessibility_granted ? 1 : 0);
    res.json({ success: true });
  });

  app.post("/api/user/use-freeze", (req, res) => {
    const user = db.prepare("SELECT * FROM users WHERE id = 1").get() as any;
    if (user.streak_freeze_used_this_week === 0) {
      db.prepare("UPDATE users SET streak_freeze_used_this_week = 1, last_focus_date = ? WHERE id = 1")
        .run(new Date().toISOString().split('T')[0]);
      res.json({ success: true });
    } else {
      res.status(400).json({ error: "Freeze already used this week" });
    }
  });

  app.post("/api/user/onboarding", (req, res) => {
    const { accessibility_granted, notifications_granted, theme } = req.body;
    db.prepare(`
      UPDATE users 
      SET onboarding_completed = 1, 
          accessibility_granted = ?, 
          notifications_granted = ?,
          theme = ?,
          focus_coins = focus_coins + 200
      WHERE id = 1
    `).run(accessibility_granted ? 1 : 0, notifications_granted ? 1 : 0, theme || 'classic');
    res.json({ success: true });
  });

  app.post("/api/user/emergency-unlock", (req, res) => {
    const { reason } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE id = 1").get() as any;
    
    if (user.emergency_unlocks_today >= 2) {
      return res.status(400).json({ error: "Maximum emergency unlocks reached for today." });
    }

    const penalty = 50; // Penalty in coins
    db.prepare(`
      UPDATE users 
      SET emergency_unlocks_today = emergency_unlocks_today + 1,
          focus_coins = MAX(0, focus_coins - ?)
      WHERE id = 1
    `).run(penalty);

    res.json({ success: true, penalty });
  });

  app.post("/api/sessions/start", (req, res) => {
    const { duration_minutes, tree_type } = req.body;
    const result = db.prepare("INSERT INTO focus_sessions (user_id, start_time, duration_minutes, tree_type) VALUES (1, ?, ?, ?)")
      .run(new Date().toISOString(), duration_minutes, tree_type || 'oak');
    res.json({ id: result.lastInsertRowid });
  });

  app.post("/api/sessions/complete", (req, res) => {
    const { session_id } = req.body;
    const session = db.prepare("SELECT * FROM focus_sessions WHERE id = ?").get() as any;
    
    const coinsEarned = Math.floor(session.duration_minutes / 5) * 10;
    const expEarned = session.duration_minutes * 2;

    db.prepare("UPDATE focus_sessions SET completed = 1, coins_earned = ? WHERE id = ?").run(coinsEarned, session_id);
    
    // Update User Stats
    const user = db.prepare("SELECT * FROM users WHERE id = 1").get() as any;
    const today = new Date().toISOString().split('T')[0];
    
    // Calculate total focus time today
    const sessionsToday = db.prepare("SELECT SUM(duration_minutes) as total FROM focus_sessions WHERE user_id = 1 AND completed = 1 AND start_time LIKE ?")
      .get(today + '%') as any;
    
    const totalMinutes = sessionsToday.total || 0;
    
    let newStreak = user.streak_count;
    let lastFocusDate = user.last_focus_date;
    let streakBonus = 0;

    if (totalMinutes >= 30 && user.last_focus_date !== today) {
      const yesterday = getYesterday();
      newStreak = (user.last_focus_date === yesterday) ? user.streak_count + 1 : 1;
      lastFocusDate = today;
      streakBonus = 50; // 50 coins per day streak
    }

    let newExp = user.experience + expEarned;
    let newLevel = user.level;
    let levelUpBonus = 0;

    if (newExp >= 1000) {
      newLevel += 1;
      newExp -= 1000;
      levelUpBonus = Math.floor(Math.random() * (700 - 500 + 1)) + 500; // 500-700 coins reward
    }

    const totalCoins = coinsEarned + streakBonus + levelUpBonus;

    db.prepare(`
      UPDATE users 
      SET streak_count = ?, 
          last_focus_date = ?, 
          focus_coins = focus_coins + ?,
          experience = ?,
          level = ?
      WHERE id = 1
    `).run(newStreak, lastFocusDate, totalCoins, newExp, newLevel);
    
    res.json({ 
      success: true, 
      coinsEarned: totalCoins, 
      breakdown: {
        session: coinsEarned,
        streak: streakBonus,
        level: levelUpBonus
      },
      expEarned, 
      leveledUp: newLevel > user.level 
    });
  });

  function getYesterday() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
