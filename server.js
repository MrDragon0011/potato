const express = require('express');
const app = express();
const fs = require('fs');
app.use(express.json());
app.use(express.static('public'));
let messages = [];
let users = [];

try {
  messages = JSON.parse(fs.readFileSync('messages.json', 'utf8'));
} catch {
  messages = [];
}

try {
  users = JSON.parse(fs.readFileSync('users.json', 'utf8'));
} catch {
  users = [];
}

function normalize(name) {
  return (name || '').trim();
}

// Used by POST /messages - just records the name, no rejection.
function rememberUser(name) {
  const trimmed = normalize(name);
  if (!trimmed || users.includes(trimmed)) return;
  users.push(trimmed);
  fs.writeFileSync('users.json', JSON.stringify(users));
}

// Used by POST /users - enforces uniqueness, lets you rename yourself.
function claimUsername(rawName, prevName) {
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

  if (prevName) {
    users = users.filter((u) => u !== prevName); // release old name
  }
  if (!users.includes(name)) {
    users.push(name);
  }
  fs.writeFileSync('users.json', JSON.stringify(users));
  return { ok: true, name };
}

app.get('/ping', (req, res) => {
  res.send('pong');
});

app.post('/messages', (req, res) => {
  const msg = {
    name: req.body.name,
    text: req.body.text,
    time: Date.now(),
  };
  messages.push(msg);
  fs.writeFileSync('messages.json', JSON.stringify(messages));
  rememberUser(msg.name);
  res.json(msg);
})

app.get('/messages', (req, res) => {
  res.json(messages)
})

app.post('/users', (req, res) => {
  const result = claimUsername(req.body.name, req.body.prevName);
  if (!result.ok) {
    return res.status(409).json(result);
  }
  res.json({ ok: true, name: result.name, users });
})

app.get('/users', (req, res) => {
  res.json(users)
})



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on port ' + PORT));