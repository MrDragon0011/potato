const vegetables = ['Potato', 'Cucumber', 'Tomato', 'Carrot']
const FORUMS = [
  {id: 'math-on-level', label: 'On Level Math', blurb: 'Algebra I'},
  {id: 'math-honors', label: 'Honors Math', blurb: 'Algebra I-H'},
  {id: 'science-lane', label: 'Science', blurb: "Dr. Lane's classes"},
  {id: 'science-carron', label: 'Science', blurb: "Mr. Carron's classes"},
  {id: 'humanities-alipour', label: 'Humanities', blurb: "Mrs. Alipour's class"},
  {id: 'humanities-fox', label: 'Humanities', blurb: "Mr. Fox's class"},
  {id: 'humanities-balan', label: 'Humanities', blurb: "Ms. Balan's Classes"}

];

const fromHash = location.hash.replace('#', '');
let currentForum = forumByID(fromHash) ? fromHash : FORUMS[0].id;

const ADMIN_NAME = 'lawrence';

function makeCrownIcon() {
  const span = document.createElement('span');
  span.className = 'crown';
  span.title = ADMIN_NAME;
  span.setAttribute('role', 'img');
  span.setAttribute('aria-label', 'crown');
  span.innerHTML =
    '<svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" title="Owner">' +
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
    body: JSON.stringify({name: myName, text: input.value, forum: currentForum}),
  });
  input.value = '';
  loadMessages();
} 

async function loadMessages() {
  const res = await fetch('/messages?forum=' + currentForum);
  if (!res.ok) return;
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

function mobile() {
  if (navigator.userAgentData?.mobile) {
    return true;
  }
  const hasTouch = window.matchMedia("(any-pointer: coarse)").matches || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.matchMedia("(max-width: 768px)").matches;
  
  if (hasTouch && isSmallScreen) {
    return true;
  }

  const ua = navigator.userAgent || navigator.vendor || window.opera;
  return /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
}

if (mobile()) {
  alert('TAD Chat works best on PC. Click close to continue.')
}

function forumByID(id){
  return FORUMS.find((f) => f.id === id);
}

function loadForumList() {
  const nav = document.getElementById('forum-list');
  nav.innerHTML = '';
  FORUMS.forEach((f) => {
    const btn = document.createElement('button');
    btn.className = 'forum-btn' + (f.id === currentForum ? ' active' : '');
    btn.dataset.forum = f.id;

    const label = document.createElement('span');
    label.className = 'forum-label';
    label.textContent = f.label;

    const blurb = document.createElement('span');
    blurb.className = 'forum-blurb-inline';
    blurb.textContent = ' ' + f.blurb;

    btn.append(label, blurb);
    btn.addEventListener('click', () => switchForum(f.id));
    nav.appendChild(btn);
  });
 }

function switchForum(id){
  if (!forumByID(id)) return;

  currentForum = id;
  location.hash = id;
  loadForumList();
  const blurb = document.getElementById('forum-blurb');
  if (blurb) blurb.textContent = forumByID(id).blurb;
  loadMessages();
}

window.addEventListener('hashchange', () => {
  const id = location.hash.replace('#', '');
  if (forumByID(id) && id !== currentForum) {
    switchForum(id);
  }
});

setInterval(getUserCount, 30000);
getUserCount();
loadForumList();
switchForum(currentForum);
setInterval(loadMessages, 3000);
loadMessages();