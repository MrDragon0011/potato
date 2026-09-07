const vegetables = ['Potato', 'Cucumber', 'Tomato', 'Carrot']

const ADMIN_NAME = 'LAWRENCEEEEE';

function makeCrownIcon() {
  const span = document.createElement('span');
  span.className = 'crown';
  span.title = ADMIN_NAME;
  span.setAttribute('role', 'img');
  span.setAttribute('aria-label', 'crown');
  span.innerHTML =
    '<svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true">' +
    '<path fill="#F5C518" stroke="#B8860B" stroke-width="1" stroke-linejoin="round" ' +
    'd="M2 8l4.5 3L12 4l5.5 7L22 8l-2 11H4L2 8z"/>' +
    '</svg>';
  return span;
}

function randomAnonName() {
  const veg = vegetables[Math.floor(Math.random() * vegetables.length)];
  const num = String(Math.floor(Math.random() * 10000) + 1);
  return 'Anonymous' + veg + num;
}

let myName = localStorage.getItem('handle');

if (!myName){
  myName = randomAnonName();
  localStorage.setItem('handle', myName);
}

async function registerName() {
  const res = await fetch('/users', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({name: myName, prevName: myName}),
  });

  // Stored name clashed with someone else - pick a new one and retry.
  if (res.status === 409) {
    myName = randomAnonName();
    localStorage.setItem('handle', myName);
    return registerName();
  }
}

registerName();

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
    if (m.name === ADMIN_NAME) {
      divtext.appendChild(makeCrownIcon());
    }
    divtext.appendChild(document.createTextNode(`${m.name}: ${m.text}`));
    div.appendChild(divtext)
    div.appendChild(code);
    chatBox.appendChild(div);

  });
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function updateUsername(){
  const input = document.getElementById('username-input');
  const newName = input.value.trim();

  if (newName === '') return;

  const res = await fetch('/users', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({name: newName, prevName: myName}),
  });

  if (!res.ok) {
    const { error } = await res.json();
    alert(error || 'Could not set that username.');
    return;
  }

  const data = await res.json();
  myName = data.name;
  localStorage.setItem('handle', myName);

  input.value = "";
  loadMessages();
}

setInterval(loadMessages, 3000);
loadMessages();

function typewriter(el, text, speed = 90) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.textContent = text;
    return;
  }
  el.textContent = '';
  el.classList.add('typing');
  let i = 0;
  (function tick() {
    if (i < text.length) {
      el.textContent += text.charAt(i);
      i += 1;
      setTimeout(tick, speed);
    } else {
      el.classList.remove('typing');
    }
  })();
}

const heading = document.querySelector('.chat-side h1');
if (heading) {
  typewriter(heading, heading.textContent.trim());
}

async function getUserCount() {
  const userDisplay = document.getElementById('user-count')
  const res = await fetch('/users');
  const users = await res.json();
  const count = users.length;
  if (userDisplay) {
    userDisplay.textContent = count;
  }
}

setInterval(getUserCount, 30000);
getUserCount();