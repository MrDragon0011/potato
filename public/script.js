const vegetables = ['Potato', 'Cucumber', 'Tomato', 'Carrot']
let myName = localStorage.getItem('handle');

if (!myName){
  const veg = vegetables[Math.floor(Math.random() * vegetables.length)];
  myName = 'Anonymous ' + veg;
  localStorage.setItem('handle', myName);
}

fetch('/users', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({name: myName}),
});

const input = document.getElementById('message-input')
input.addEventListener('keydown', (event) => {
  if (event.key === 'Enter'){
    event.preventDefault()
    sendMessage()
  }
})

async function sendMessage() {
  const input = document.getElementById('message-input')
  if (input.value.trim() === '') return;

  await fetch('/messages', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({name: myName, text: input.value}),
  });
  input.value = '';
  loadMessages();
} 

async function loadMessages() {
  const res = await fetch('/messages');
  const messages = await res.json();
  const chatBox = document.getElementById('chat-box');
  chatBox.innerHTML = ''
  messages.forEach((m) => {
    const div = document.createElement('div');
    const code = document.createElement('code');
    const divtext = document.createElement('span');
    code.textContent = ` ${new Date(m.time).toLocaleTimeString()}`;
    divtext.textContent = `${m.name}: ${m.text}`;
    div.appendChild(divtext)
    div.appendChild(code);
    chatBox.appendChild(div);

  });
  chatBox.scrollTop = chatBox.scrollHeight;
}

setInterval(loadMessages, 3000);
loadMessages();