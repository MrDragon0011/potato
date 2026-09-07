const vegetables = ['Potato', 'Cucumber', 'Tomato', 'Carrot']
let myName = localStorage.getItem('handle');

if (!myName){
  const veg = vegetables[Math.floor(Math.random() * vegetables.length)];
  myName = 'Anonymous ' + veg;
  localStorage.setItem('handle', myName);
}

const input = document.getElementById('message-input')
chatBox.addEventListener('keydown', (event) => {
  if (event.key === 'Enter'){
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
    div.textContent = `${m.name}: ${m.text}`;
    chatBox.appendChild(div);

  });
  chatBox.scrollTop = chatBox.scrollHeight;
}

setInterval(loadMessages, 3000);
loadMessages();