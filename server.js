const express = require('express');
const { Redis } = require('@upstash/redis');
const app = express();
app.use(express.json());
app.use(express.static('public'));
const redis = Redis.fromEnv();
const MESSAGES_KEY = 'messages';
const USERS_KEY = 'users';
const forum_ids = ['math-on-level', 'math-honors', 'science-lane',  'science-carron', 'humanities-alipour', 'humanities-fox', 'humanities-balan'];
const isForum = (id) => forum_ids.includes(id);
const messagesKey = (forum) => 'messages:' + forum;
let messages = {};
let users = [];


async function loadState() {
  const [storedMessages, storedUsers] = await Promise.all([
    redis.get(MESSAGES_KEY),
    redis.get(USERS_KEY),
  ]);
  messages = Array.isArray(storedMessages) ? storedMessages : [];
  users = Array.isArray(storedUsers) ? storedUsers : [];
}

function normalize(name) {
  return (name || '').trim();
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
  const msg = {
    name: req.body.name,
    text: req.body.text,
    time: Date.now(),
  };

  const next = [...messages, msg];
  try {
    await redis.set(MESSAGES_KEY, next);
    messages = next;
  } catch (err) {
    console.error('Failed to save message:', err);
    return res.status(500).json({ ok: false, error: 'Could not save message.' });
  }

  try {
    await rememberUser(msg.name);
  } catch (err) {
    console.error('Failed to remember user:', err);
  }

  res.json(msg);
});

app.get('/messages', (req, res) => {
  res.json(messages);
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

const PORT = process.env.PORT || 3000;

loadState()
  .then(() => {
    app.listen(PORT, () => console.log('Server running on port ' + PORT));``
  })
  .catch((err) => {
    console.error('Failed to load state from Redis:', err);
    process.exit(1);
  });
