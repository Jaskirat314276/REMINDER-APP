// server.js — Medicine Reminder SMS System
require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const twilio = require('twilio');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'reminders.json');

// ---------- Twilio setup ----------
const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM = process.env.TWILIO_FROM_NUMBER; // e.g. +14155552671

let twilioClient = null;
if (TWILIO_SID && TWILIO_TOKEN) {
  twilioClient = twilio(TWILIO_SID, TWILIO_TOKEN);
  console.log('✓ Twilio client initialized');
} else {
  console.warn('⚠ Twilio credentials missing — SMS will be logged to console only (DRY RUN mode)');
}

// ---------- Storage helpers ----------
function loadReminders() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {
    console.error('Failed to load reminders:', e);
    return [];
  }
}

function saveReminders(reminders) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(reminders, null, 2));
}

// ---------- Cron job management ----------
// Map of reminderId -> array of cron tasks (one per time slot)
const activeJobs = new Map();

function timeToCronExpr(timeStr) {
  // timeStr is "HH:MM" (24-hour) → cron "M H * * *" (every day)
  const [hour, minute] = timeStr.split(':').map(Number);
  if (isNaN(hour) || isNaN(minute)) throw new Error('Invalid time: ' + timeStr);
  return `${minute} ${hour} * * *`;
}

async function sendSMS(to, body) {
  if (!twilioClient) {
    console.log(`[DRY RUN] SMS to ${to}: "${body}"`);
    return { dryRun: true };
  }
  try {
    const msg = await twilioClient.messages.create({
      body,
      from: TWILIO_FROM,
      to,
    });
    console.log(`✓ SMS sent to ${to} (sid: ${msg.sid})`);
    return { sid: msg.sid };
  } catch (err) {
    console.error(`✗ SMS failed to ${to}:`, err.message);
    throw err;
  }
}

function scheduleReminder(reminder) {
  // Clean up any old jobs for this reminder first
  unscheduleReminder(reminder.id);

  const tasks = reminder.times.map((timeStr) => {
    const cronExpr = timeToCronExpr(timeStr);
    const task = cron.schedule(
      cronExpr,
      () => {
        console.log(`⏰ Triggering reminder ${reminder.id} at ${timeStr}`);
        sendSMS(reminder.phone, reminder.message).catch(() => {});
      },
      { timezone: process.env.TZ || 'Asia/Kolkata' }
    );
    return task;
  });

  activeJobs.set(reminder.id, tasks);
  console.log(`✓ Scheduled reminder ${reminder.id} for times: ${reminder.times.join(', ')}`);
}

function unscheduleReminder(id) {
  const tasks = activeJobs.get(id);
  if (tasks) {
    tasks.forEach((t) => t.stop());
    activeJobs.delete(id);
  }
}

// ---------- Restore schedules on startup ----------
function restoreSchedules() {
  const reminders = loadReminders();
  reminders.forEach(scheduleReminder);
  console.log(`✓ Restored ${reminders.length} reminder(s) from storage`);
}

// ---------- API ----------
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// List all reminders
app.get('/api/reminders', (req, res) => {
  res.json(loadReminders());
});

// Create a new reminder
app.post('/api/reminders', (req, res) => {
  const { phone, message, times } = req.body;

  // Validation
  if (!phone || !/^\+\d{8,15}$/.test(phone)) {
    return res.status(400).json({ error: 'Phone must be in E.164 format, e.g. +919876543210' });
  }
  if (!message || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message is required' });
  }
  if (!Array.isArray(times) || times.length === 0) {
    return res.status(400).json({ error: 'At least one time is required' });
  }
  for (const t of times) {
    if (!/^\d{2}:\d{2}$/.test(t)) {
      return res.status(400).json({ error: `Invalid time format: ${t} (use HH:MM)` });
    }
  }

  const reminders = loadReminders();
  const reminder = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    phone: phone.trim(),
    message: message.trim(),
    times,
    createdAt: new Date().toISOString(),
  };
  reminders.push(reminder);
  saveReminders(reminders);
  scheduleReminder(reminder);

  res.json(reminder);
});

// Delete a reminder
app.delete('/api/reminders/:id', (req, res) => {
  const { id } = req.params;
  const reminders = loadReminders();
  const idx = reminders.findIndex((r) => r.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  reminders.splice(idx, 1);
  saveReminders(reminders);
  unscheduleReminder(id);

  res.json({ ok: true });
});

// Send a test SMS immediately
app.post('/api/test', async (req, res) => {
  const { phone, message } = req.body;
  if (!phone || !message) return res.status(400).json({ error: 'phone and message required' });
  try {
    const result = await sendSMS(phone, message);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Start ----------
app.listen(PORT, () => {
  console.log(`\n💊 Medicine Reminder running at http://localhost:${PORT}`);
  console.log(`   Timezone: ${process.env.TZ || 'Asia/Kolkata'}`);
  restoreSchedules();
});
