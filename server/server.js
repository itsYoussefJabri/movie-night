import express from "express";
import cors from "cors";
import QRCode from "qrcode";
import { google } from "googleapis";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@libsql/client";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });
const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === "production";

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ── Serve React build in production ──────────────────────────────
if (isProd) {
  const distPath = path.join(__dirname, "..", "dist");
  app.use(express.static(distPath));
}

// ── Database Setup (Turso in prod, local SQLite in dev) ──────────
const db = createClient(
  process.env.TURSO_DATABASE_URL
    ? {
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
      }
    : { url: "file:server/movienight.db" },
);

async function initDB() {
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      serial TEXT UNIQUE NOT NULL,
      email TEXT NOT NULL,
      checked_in INTEGER DEFAULT 0,
      checked_in_at TEXT,
      created_at TEXT DEFAULT (datetime('now', '+1 hour'))
    );
    
    CREATE TABLE IF NOT EXISTS attendees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      registration_id INTEGER NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      vip INTEGER DEFAULT 0,
      FOREIGN KEY (registration_id) REFERENCES registrations(id)
    );
  `);

  // Migrate: add vip column if missing (for existing databases)
  try {
    await db.execute("ALTER TABLE attendees ADD COLUMN vip INTEGER DEFAULT 0");
    console.log("✅ Migrated: added vip column to attendees");
  } catch {
    // Column already exists — ignore
  }
  console.log(
    `📦 Database ready (${process.env.TURSO_DATABASE_URL ? "Turso cloud" : "local SQLite"})`,
  );
}

// ── Generate unique serial ───────────────────────────────────────
function generateSerial() {
  const prefix = "MN";
  const year = new Date().getFullYear();
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `${prefix}-${year}-${random}`;
}

// ── Email (Gmail API over HTTPS) ──────────────────────────────────
const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID || "";
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || "";
const GMAIL_REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN || "";
const GMAIL_USER = process.env.GMAIL_USER || "";
const SENDER_NAME = process.env.SENDER_NAME || "Bdr Chaabi";

let gmail = null;

function setupMailer() {
  if (GMAIL_CLIENT_ID && GMAIL_CLIENT_SECRET && GMAIL_REFRESH_TOKEN && GMAIL_USER) {
    const oAuth2Client = new google.auth.OAuth2(
      GMAIL_CLIENT_ID,
      GMAIL_CLIENT_SECRET,
      "https://developers.google.com/oauthplayground"
    );
    oAuth2Client.setCredentials({ refresh_token: GMAIL_REFRESH_TOKEN });
    gmail = google.gmail({ version: "v1", auth: oAuth2Client });
    console.log(`📧 Gmail API ready (${GMAIL_USER})`);
  } else {
    console.warn(`📧 Gmail API credentials missing — emails will not be sent`);
  }
}

// ── POST /api/register ──────────────────────────────────────────
app.post("/api/register", async (req, res) => {
  try {
    const { email, attendees } = req.body;

    if (!email || !attendees || !attendees.length) {
      return res
        .status(400)
        .json({ error: "Email and at least one attendee required" });
    }

    for (const a of attendees) {
      if (!a.firstName?.trim() || !a.lastName?.trim()) {
        return res
          .status(400)
          .json({ error: "All attendees must have first and last names" });
      }
    }

    const serial = generateSerial();

    // Insert registration
    const regResult = await db.execute({
      sql: "INSERT INTO registrations (serial, email) VALUES (?, ?)",
      args: [serial, email],
    });

    const regId = Number(regResult.lastInsertRowid);

    // Insert attendees
    for (const a of attendees) {
      await db.execute({
        sql: "INSERT INTO attendees (registration_id, first_name, last_name, vip) VALUES (?, ?, ?, ?)",
        args: [regId, a.firstName.trim(), a.lastName.trim(), a.vip ? 1 : 0],
      });
    }

    // Generate QR code data
    const qrData = JSON.stringify({
      serial,
      names: attendees.map((a) => `${a.firstName} ${a.lastName}`),
      vips: attendees.map((a) => !!a.vip),
    });
    const qrDataUrl = await QRCode.toDataURL(qrData, {
      width: 400,
      margin: 2,
      color: { dark: "#0a0a0a", light: "#ffffff" },
    });

    // Build a public QR code URL (email clients block base64 data URIs)
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrData)}`;

    // Send email via Gmail API
    let emailSent = false;
    if (gmail) {
      try {
        const htmlBody = `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
            <body style="margin:0;padding:0;background:#f4f4f4;font-family:'Helvetica Neue',Arial,sans-serif;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
                <tr><td align="center">
                  <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                    
                    <!-- Header -->
                    <tr><td style="background:linear-gradient(135deg,#e50914 0%,#b20710 100%);padding:45px 30px;text-align:center;">
                      <h1 style="margin:0;font-size:34px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">MOVIE NIGHT</h1>
                      <p style="margin:12px 0 0;font-size:14px;color:rgba(255,255,255,0.9);font-weight:400;">Your ticket is confirmed</p>
                    </td></tr>
                    
                    <!-- QR Code -->
                    <tr><td style="padding:35px 30px 20px;text-align:center;">
                      <p style="margin:0 0 20px;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:2px;font-weight:600;">Your QR Ticket</p>
                      <div style="display:inline-block;padding:16px;background:#ffffff;border:2px solid #eee;border-radius:16px;">
                        <img src="${qrImageUrl}" alt="QR Code" width="220" height="220" style="display:block;border-radius:8px;" />
                      </div>
                    </td></tr>
                    
                    <!-- Serial -->
                    <tr><td style="padding:0 30px;text-align:center;">
                      <div style="display:inline-block;padding:18px 40px;background:#fafafa;border-radius:12px;border:1px solid #eee;">
                        <p style="margin:0;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:2px;font-weight:600;">Serial Number</p>
                        <p style="margin:6px 0 0;font-size:18px;font-weight:800;color:#e50914;letter-spacing:1px;font-family:'Courier New',monospace;white-space:nowrap;">${serial}</p>
                      </div>
                    </td></tr>
                    
                    <!-- Attendees -->
                    <tr><td style="padding:20px 30px;text-align:center;">
                      <div style="display:inline-block;padding:18px 40px;background:#fafafa;border-radius:12px;border:1px solid #eee;">
                        <p style="margin:0 0 10px;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:2px;font-weight:600;">Attendees</p>
                        ${attendees.map((a, i) => `<p style="margin:0;padding:6px 0;font-size:15px;color:#333;font-weight:500;border-bottom:${i < attendees.length - 1 ? "1px solid #eee" : "none"};">${a.firstName} ${a.lastName}${a.vip ? ' <span style="display:inline-block;background:linear-gradient(135deg,#f5c518,#e6a800);color:#1a1a1a;font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;margin-left:6px;letter-spacing:1px;">VIP</span>' : ''}</p>`).join("")}
                      </div>
                    </td></tr>
                    
                    <!-- Divider -->
                    <tr><td style="padding:5px 30px 0;"><div style="border-top:1px dashed #ddd;"></div></td></tr>
                    
                    <!-- Footer -->
                    <tr><td style="padding:25px 30px 35px;text-align:center;">
                      <p style="margin:0 0 5px;font-size:13px;color:#666;">Present this QR code at the entrance for check-in.</p>
                      <p style="margin:0;font-size:12px;color:#aaa;">This ticket is unique and cannot be duplicated.</p>
                    </td></tr>
                    
                  </table>
                  
                  <!-- Below card -->
                  <p style="margin:25px 0 0;font-size:11px;color:#999;text-align:center;">Sent by ${SENDER_NAME} &bull; Movie Night Event</p>
                </td></tr>
              </table>
            </body>
            </html>
          `;

        // Build RFC 2822 email
        const rawEmail = [
          `From: ${SENDER_NAME} <${GMAIL_USER}>`,
          `To: ${email}`,
          `Subject: Your Movie Night Ticket`,
          `MIME-Version: 1.0`,
          `Content-Type: text/html; charset="UTF-8"`,
          ``,
          htmlBody,
        ].join("\r\n");

        const encodedMessage = Buffer.from(rawEmail)
          .toString("base64")
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");

        await gmail.users.messages.send({
          userId: "me",
          requestBody: { raw: encodedMessage },
        });

        emailSent = true;
        console.log(`📧 Email sent to ${email} via Gmail API`);
      } catch (emailErr) {
        console.error(
          "📧 Email failed (registration still saved):",
          emailErr.message,
        );
      }
    }

    res.json({
      success: true,
      serial,
      qrData,
      attendees: attendees.map((a) => ({
        firstName: a.firstName.trim(),
        lastName: a.lastName.trim(),
      })),
      emailSent,
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

// ── POST /api/checkin ────────────────────────────────────────────
app.post("/api/checkin", async (req, res) => {
  try {
    const { serial } = req.body;

    if (!serial) {
      return res.status(400).json({ error: "Serial number required" });
    }

    const result = await db.execute({
      sql: `
        SELECT r.*, GROUP_CONCAT(a.first_name || ' ' || a.last_name, ', ') as names,
               GROUP_CONCAT(a.vip, ', ') as vips
        FROM registrations r
        JOIN attendees a ON a.registration_id = r.id
        WHERE r.serial = ?
        GROUP BY r.id
      `,
      args: [serial],
    });

    const reg = result.rows[0];

    if (!reg) {
      return res.json({
        valid: false,
        message: "Invalid QR code — not found in database",
      });
    }

    const hasVip = reg.vips ? reg.vips.split(', ').some(v => v === '1') : false;

    if (reg.checked_in) {
      return res.json({
        valid: false,
        alreadyUsed: true,
        message: `Already checked in at ${reg.checked_in_at}`,
        names: reg.names,
        serial: reg.serial,
        hasVip,
      });
    }

    // Mark as checked in
    await db.execute({
      sql: "UPDATE registrations SET checked_in = 1, checked_in_at = datetime('now', '+1 hour') WHERE serial = ?",
      args: [serial],
    });

    res.json({
      valid: true,
      message: "Welcome to Movie Night!",
      names: reg.names,
      serial: reg.serial,
      hasVip,
    });
  } catch (err) {
    console.error("Check-in error:", err);
    res.status(500).json({ error: "Check-in failed" });
  }
});

// ── DELETE /api/attendees/:serial ─────────────────────────────────
app.delete("/api/attendees/:serial", async (req, res) => {
  try {
    const { serial } = req.params;
    const result = await db.execute({
      sql: "SELECT id FROM registrations WHERE serial = ?",
      args: [serial],
    });
    const reg = result.rows[0];
    if (!reg) {
      return res.status(404).json({ error: "Registration not found" });
    }
    await db.execute({
      sql: "DELETE FROM attendees WHERE registration_id = ?",
      args: [reg.id],
    });
    await db.execute({
      sql: "DELETE FROM registrations WHERE id = ?",
      args: [reg.id],
    });
    res.json({ success: true, message: "Registration deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Failed to delete registration" });
  }
});

// ── GET /api/attendees ───────────────────────────────────────────
app.get("/api/attendees", async (req, res) => {
  try {
    const result = await db.execute(`
      SELECT r.serial, r.email, r.checked_in, r.checked_in_at, r.created_at,
             GROUP_CONCAT(a.first_name || ' ' || a.last_name, ', ') as names,
             MAX(a.vip) as has_vip
      FROM registrations r
      JOIN attendees a ON a.registration_id = r.id
      GROUP BY r.id
      ORDER BY r.created_at DESC
    `);

    const rows = result.rows;

    res.json({
      attendees: rows,
      total: rows.length,
      checkedIn: rows.filter((r) => r.checked_in).length,
    });
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ error: "Failed to fetch attendees" });
  }
});

// ── Catch-all: serve React app in production ─────────────────────
if (isProd) {
  app.get("/{*splat}", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "dist", "index.html"));
  });
}

// ── Start ────────────────────────────────────────────────────────
async function start() {
  await initDB();
  setupMailer();
  app.listen(PORT, () => {
    console.log(`\n🎬 Movie Night Server running on http://localhost:${PORT}`);
    console.log(`   Mode: ${isProd ? "PRODUCTION" : "DEVELOPMENT"}\n`);
  });
}

start();
