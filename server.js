const express = require('express');
const app = express();
const fs = require('fs');
app.use(express.json());
app.use(express.static('public'));
const messages = [];
try {
  messages = JSON.parse(fs.readFileSync('messages.json', 'utf8'));
} catch {
  messages = [];
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
  res.json(msg);
})

app.get('/messages', (req, res) => {
  res.json(messages)
})

app.listen(3000, () => console.log('Server running on port 3000'));