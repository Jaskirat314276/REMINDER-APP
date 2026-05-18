<div align="center">

# 💊 Medicine Reminder

### Never miss a dose. A tiny, zero-friction SMS reminder service.

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![Twilio](https://img.shields.io/badge/Twilio-SMS-F22F46?style=flat-square&logo=twilio&logoColor=white)](https://www.twilio.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](#contributing)

**[Quick Start](#-quick-start) · [Features](#-features) · [API](#-api) · [Deploy](#-deployment) · [FAQ](#-faq)**

</div>

---

## ✨ Features

- 📱 **Daily SMS reminders** — set one or more times per day
- 🕒 **Timezone aware** — schedules in your local TZ (defaults to `Asia/Kolkata`)
- 💾 **Persistent** — reminders survive server restarts (JSON file storage, no DB)
- 🧪 **Dry-run mode** — test without Twilio credentials; messages are logged to console
- 🎨 **Editorial web UI** — live clock, custom stepper time picker, vanilla HTML/CSS/JS, no build step
- 🪶 **Lightweight** — ~180 lines of backend code, four dependencies
- 🔓 **No auth, no signup** — just open it and create reminders

### 🎛️ UI highlights

- **Live clock** in the header (HH\:MM\:SS · weekday · date), ticking every second
- **Custom time stepper** replacing the native `<input type="time">` — change times with:
  - `▲ / ▼` chevrons
  - Mouse **scroll wheel** over hour/minute columns
  - Keyboard **arrow keys** (↑↓ hours · ←→ minutes)
  - One-click **presets**: `MORN` (08:00) · `NOON` (12:00) · `EVE` (18:00) · `NITE` (21:00)
- **Editorial typography** — Fraunces serif headings, JetBrains Mono digits, Inter body

---

## 🧱 Tech Stack

| Layer       | Tool                                                  |
| ----------- | ----------------------------------------------------- |
| Runtime     | [Node.js 18+](https://nodejs.org/)                    |
| Server      | [Express](https://expressjs.com/)                     |
| Scheduling  | [node-cron](https://github.com/node-cron/node-cron)   |
| SMS gateway | [Twilio](https://www.twilio.com/)                     |
| Storage     | JSON file (no DB)                                     |
| Frontend    | Vanilla HTML / CSS / JS                               |

---

## 🚀 Quick Start

### 1. Clone & install

```bash
git clone https://github.com/<your-username>/medicine-reminder.git
cd medicine-reminder
npm install
```

### 2. Get Twilio credentials *(free trial)*

1. Sign up at [twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. From the [Twilio Console](https://console.twilio.com), copy:
   - **Account SID** *(starts with `AC…`)*
   - **Auth Token**
   - **A Twilio phone number** *(e.g. `+14155552671`)*
3. On the free trial, you can only SMS **verified numbers**. Verify the destination phone at *Phone Numbers → Verified Caller IDs*.

> 🧪 **Skip this step** if you just want to try the app — it'll run in dry-run mode and log SMS to the console.

### 3. Configure environment

```bash
cp .env.example .env
```

Open `.env` and fill in your Twilio creds. Adjust `TZ` to your timezone if needed.

### 4. Run

```bash
npm start
```

Open **[http://localhost:3000](http://localhost:3000)** and you're set. 🎉

---

## 📖 How to use

1. **Phone number** — E.164 format with country code (e.g. `+919876543210`)
2. **Message** — what the SMS should say (e.g. *"Time for your blood pressure meds!"*)
3. **Times** — one or more `HH:MM` (24-hour). Each reminder fires **daily** at those times.
4. Click **Schedule reminder** — done.

Reminders run as long as the server is up. They're saved to `reminders.json` and auto-restored on restart.

---

## 🔌 API

Everything the UI does is also exposed via REST. Drive it from `curl`, Postman, or a script.

| Method   | Endpoint              | Body                                          | Description                  |
| -------- | --------------------- | --------------------------------------------- | ---------------------------- |
| `GET`    | `/api/reminders`      | —                                             | List all reminders           |
| `POST`   | `/api/reminders`      | `{ phone, message, times: ["08:00","20:00"] }`| Create a new reminder        |
| `DELETE` | `/api/reminders/:id`  | —                                             | Delete a reminder            |
| `POST`   | `/api/test`           | `{ phone, message }`                          | Send one SMS right now       |

<details>
<summary><b>Example: create a reminder via curl</b></summary>

```bash
curl -X POST http://localhost:3000/api/reminders \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+919876543210",
    "message": "Take your morning meds 💊",
    "times": ["08:00", "20:00"]
  }'
```

</details>

<details>
<summary><b>Example: send a test SMS</b></summary>

```bash
curl -X POST http://localhost:3000/api/test \
  -H "Content-Type: application/json" \
  -d '{ "phone": "+919876543210", "message": "Hello from Medicine Reminder!" }'
```

</details>

---

## 🧪 Dry-run mode

Leave `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` **blank** in `.env` and the app runs in dry-run mode:

```
⚠ Twilio credentials missing — SMS will be logged to console only (DRY RUN mode)
...
⏰ Triggering reminder abc123 at 08:00
[DRY RUN] SMS to +919876543210: "Take your morning meds 💊"
```

Useful for development, demos, and CI.

---

## 📁 Project structure

```
medicine-reminder/
├── server.js          # Express + node-cron + Twilio
├── package.json
├── .env.example       # Copy → .env and fill in
├── reminders.json     # Auto-created; persisted reminder store
└── public/
    └── index.html     # Frontend (vanilla)
```

---

## ☁️ Deployment

The server must stay running for reminders to fire. Free / cheap options:

- **[Railway](https://railway.app/)** — one-click Node deploy, free starter tier
- **[Render](https://render.com/)** — free web service tier (sleeps after inactivity; not ideal for crons)
- **[Fly.io](https://fly.io/)** — always-on small VM, generous free tier
- **A $5/mo VPS** — DigitalOcean, Hetzner, Linode

> 💡 **Tip:** for true 24/7 reliability, use an always-on host. A sleeping laptop won't fire reminders.

Set your env vars on the host (Twilio creds + `TZ`), then `npm start`. That's it.

---

## ❓ FAQ

<details>
<summary><b>Why aren't I receiving SMS?</b></summary>

Three usual suspects:
1. Twilio creds missing → check the startup log for *"DRY RUN mode"*.
2. On Twilio free trial, the recipient number must be **verified** in the console.
3. Phone number isn't in E.164 format — must include `+` and country code.
</details>

<details>
<summary><b>Can I use this without Twilio?</b></summary>

Not out of the box. Easy swap candidates: Telegram Bot API, WhatsApp via <code>whatsapp-web.js</code>, Email via Nodemailer, or push notifications via <a href="https://ntfy.sh">ntfy.sh</a>. The send function (<code>sendSMS</code> in <code>server.js</code>) is one ~15-line block — replace it with any of those.
</details>

<details>
<summary><b>How are reminders stored?</b></summary>

In <code>reminders.json</code> at the project root, written synchronously after each create/delete. Good enough for personal use; swap to SQLite or Redis if you need more.
</details>

<details>
<summary><b>What timezone are the times in?</b></summary>

Whatever you set <code>TZ</code> to in <code>.env</code> (default: <code>Asia/Kolkata</code>). Each cron job is bound to that TZ.
</details>

---

## 🛠️ Roadmap

- [ ] Per-reminder timezone (instead of server-wide)
- [ ] Weekday / weekend / custom-day schedules
- [ ] Optional auth + multi-user support
- [ ] Telegram / WhatsApp / Email adapters
- [ ] Snooze & one-tap "taken" confirmation reply

PRs welcome — see [Contributing](#-contributing) below.

---

## 🤝 Contributing

1. Fork the repo
2. Create a branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m "feat: add X"`
4. Push: `git push origin feat/your-feature`
5. Open a Pull Request

Bug reports and feature requests via [GitHub Issues](../../issues).

---

## 📜 License

[MIT](LICENSE) — do whatever you want, no warranty.

---

<div align="center">

Made with ☕ and a healthy fear of forgetting medications.

⭐ **Star this repo** if it helped you (or someone you care about) stay on schedule.

</div>
# REMINDER-APP
