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

function rememberUser(name) {
  if (!name || users.includes(name)) return;
  users.push(name);
  fs.writeFileSync('users.json', JSON.stringify(users));
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
  rememberUser(req.body.name);
  res.json(users);
})

app.get('/users', (req, res) => {
  res.json(users)
})



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on port ' + PORT));