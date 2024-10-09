document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    const chatMessages = document.getElementById('chat-messages');
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    const nicknameInput = document.getElementById('nickname-input');
    const typingIndicator = document.getElementById('typing-indicator');

    let typingTimer;
    const doneTypingInterval = 1000;

    messageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (messageInput.value.trim() && nicknameInput.value.trim()) {
            socket.emit('send_message', { message: messageInput.value, nickname: nicknameInput.value });
            messageInput.value = '';
            socket.emit('stop_typing', { nickname: nicknameInput.value });
        }
    });

    messageInput.addEventListener('input', () => {
        clearTimeout(typingTimer);
        if (messageInput.value && nicknameInput.value.trim()) {
            socket.emit('typing', { nickname: nicknameInput.value });
            typingTimer = setTimeout(() => {
                socket.emit('stop_typing', { nickname: nicknameInput.value });
            }, doneTypingInterval);
        } else {
            socket.emit('stop_typing', { nickname: nicknameInput.value });
        }
    });

    socket.on('receive_message', (data) => {
        const messageElement = document.createElement('div');
        const nicknameElement = document.createElement('span');
        nicknameElement.textContent = `${data.nickname}: `;
        nicknameElement.className = 'font-bold mr-2';
        messageElement.appendChild(nicknameElement);
        const timestampElement = document.createElement('span');
        timestampElement.textContent = data.timestamp;
        timestampElement.className = 'text-xs text-gray-500 mr-2';
        messageElement.appendChild(timestampElement);
        const messageTextElement = document.createElement('span');
        messageTextElement.textContent = data.message;
        messageElement.appendChild(messageTextElement);
        messageElement.className = 'mb-2 p-2 bg-gray-200 rounded flex items-center';
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });

    socket.on('user_typing', (data) => {
        typingIndicator.textContent = `${data.nickname} is typing...`;
        typingIndicator.classList.remove('hidden');
    });

    socket.on('user_stop_typing', (data) => {
        typingIndicator.classList.add('hidden');
    });
});
