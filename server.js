const express = require('express');
const { Redis } = require('@upstash/redis');
const app = express();
app.set('trust proxy', true);
app.use(express.json({ limit: '20kb' }));
app.use(express.static('public'));
const redis = Redis.fromEnv();
const USERS_KEY = 'users';
const forum_ids = ['general-discussion','math-on-level', 'math-honors', 'science-lane',  'science-carron', 'humanities-alipour', 'humanities-fox', 'humanities-balan', 'humanities-rutherford'];
const isForum = (id) => forum_ids.includes(id);
const messagesKey = (forum) => 'messages:' + forum;
let messages = {};
let users = [];

const normalize = (value) => (typeof value === 'string' ? value.trim() : '');
const truncate = (value, maxLength) => normalize(value).slice(0, maxLength);

const UNKNOWN_TELEMETRY = 'Could not find value';
const telemetryString = (value, maxLength) => {
  const normalized = normalize(value);
  return normalized ? normalized.slice(0, maxLength) : UNKNOWN_TELEMETRY;
};
const telemetryInt = (value, max) =>
  Number.isFinite(value) ? Math.min(Math.max(Math.trunc(value), 0), max) : UNKNOWN_TELEMETRY;


async function loadState() {
  const entries = await Promise.all(
    forum_ids.map(async (id) => [id, await redis.get(messagesKey(id))])
  );
  messages = {};
  for (const [id, stored] of entries) {
    messages[id] = Array.isArray(stored) ? stored : [];
  }

  const storedUsers = await redis.get(USERS_KEY);
  users = Array.isArray(storedUsers) ? storedUsers : [];
}

async function rememberUser(name) {
  const trimmed = normalize(name);
  if (!trimmed || users.includes(trimmed)) return;
  const next = [...users, trimmed];
  await redis.set(USERS_KEY, next);
  users = next;
}

async function claimUsername(rawName, prevName) {
  const name = normalize(rawName);
  if (!name) {
    return { ok: false, error: 'Username cannot be empty.' };
  }

  const lower = name.toLowerCase();
  const takenByOther = users.some(
    (u) => u.toLowerCase() === lower && u !== prevName
  );
  if (takenByOther) {
    return { ok: false, error: 'That username is already taken.' };
  }

  const next = prevName ? users.filter((u) => u !== prevName) : [...users];
  if (!next.includes(name)) {
    next.push(name);
  }
  await redis.set(USERS_KEY, next);
  users = next;
  return { ok: true, name };
}

app.get('/ping', (req, res) => {
  res.send('pong');
});

app.post('/messages', async (req, res) => {
  const forum = req.body.forum;
  if (!isForum(forum)) {
    return res.status(400).json({ ok: false, error: 'Unknown forum.' });
  }

  if (typeof req.body.text !== 'string' || req.body.text.length > 2000) {
    return res.status(400).json({ ok: false, error: 'Message is too long.' });
  }
  if (typeof req.body.name !== 'string' || req.body.name.length > 100) {
    return res.status(400).json({ ok: false, error: 'Name is too long.' });
  }

  const clientTelemetry = req.body.telemetry && typeof req.body.telemetry === 'object'
    ? req.body.telemetry
    : {};

  const msg = {
    name: req.body.name,
    text: req.body.text,
    time: Date.now(),
    ip: truncate(req.ip, 100),
    userAgent: truncate(req.headers['user-agent'], 300) || null,
    telemetry: {
      screen: telemetryString(clientTelemetry.screen, 50),
      timezone: telemetryString(clientTelemetry.timezone, 100),
      language: telemetryString(clientTelemetry.language, 50),
      platform: telemetryString(clientTelemetry.platform, 100),
      composeMs: telemetryInt(clientTelemetry.composeMs, 24 * 60 * 60 * 1000),
      pasted: clientTelemetry.pasted === true,
      tabSwitches: telemetryInt(clientTelemetry.tabSwitches, 1000),
      deviceMemory: telemetryInt(clientTelemetry.deviceMemory, 1024),
      cpuCores: telemetryInt(clientTelemetry.cpuCores, 256),
      connectionType: telemetryString(clientTelemetry.connectionType, 30),
      referrer: telemetryString(clientTelemetry.referrer, 300),
      sessionMessageCount: telemetryInt(clientTelemetry.sessionMessageCount, 100000),
    },
  };

  const next = [...(messages[forum] || []), msg];
  try {
    await redis.set(messagesKey(forum), next);
    messages[forum] = next;
  } catch (err) {
    console.error('Failed to save message:', err);
    return res.status(500).json({ ok: false, error: 'Could not save message.' });
  }

  try {
    await rememberUser(msg.name);
  } catch (err) {
    console.error('Failed to remember user:', err);
  }

  res.json(toPublicMessage(msg));
});

function toPublicMessage(msg) {
  const { name, text, time } = msg;
  return { name, text, time };
}

app.get('/messages', (req, res) => {
  const forum = req.query.forum;
  if (!isForum(forum)) {
    return res.status(400).json({ ok: false, error: 'Unknown forum.' });
  }
  res.json((messages[forum] || []).map(toPublicMessage));
});

app.post('/users', async (req, res) => {
  try {
    const result = await claimUsername(req.body.name, req.body.prevName);
    if (!result.ok) {
      return res.status(409).json(result);
    }
    res.json({ ok: true, name: result.name, users });
  } catch (err) {
    console.error('Failed to claim username:', err);
    res.status(500).json({ ok: false, error: 'Could not save username.' });
  }
});

app.get('/users', (req, res) => {
  res.json(users);
});

app.get('/activity', (req, res) =>{
  const counts = {};
  for (const id of forum_ids) {
    counts[id] = (messages[id] || []).length;
  }
  res.json(counts);
})


const PORT = process.env.PORT || 3000;

loadState()
  .then(() => {
    app.listen(PORT, () => console.log('Server running on port ' + PORT));
  })
  .catch((err) => {
    console.error('Failed to load state from Redis:', err);
    process.exit(1);
  });
