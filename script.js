function sendMessage() {
  const input = document.getElementById('message-input')
  const chatBox = document.getElementById('chat-box')

  if (input.value.trim() != '') {
    const message = document.createElement('div');
    message.textContent = input.value;
    chatBox.appendChild(message);
    input.value = '';
    chatBox.scrollTop = chatBox.scrollHeight;
  }
}