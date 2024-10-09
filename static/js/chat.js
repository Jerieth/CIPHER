document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    const chatMessages = document.getElementById('chat-messages');
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    const nicknameInput = document.getElementById('nickname-input');
    const typingIndicator = document.getElementById('typing-indicator');

    let typingTimer;
    const doneTypingInterval = 1000;

    socket.on('connect', () => {
        console.log('Connected to server');
    });

    messageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (messageInput.value.trim() && nicknameInput.value.trim()) {
            socket.emit('send_message', { message: messageInput.value, nickname: nicknameInput.value });
            messageInput.value = '';
            socket.emit('stop_typing', { nickname: nicknameInput.value });
        }
    });

    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            messageForm.dispatchEvent(new Event('submit'));
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
        nicknameElement.className = 'font-bold text-blue-700 mr-2';
        messageElement.appendChild(nicknameElement);
        const messageTextElement = document.createElement('span');
        messageTextElement.textContent = data.message;
        messageElement.appendChild(messageTextElement);
        messageElement.className = 'mb-2 p-2 bg-chat-bg rounded flex items-center text-lg';
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });

    socket.on('user_typing', (data) => {
        if (data.nickname === 'EVA') {
            typingIndicator.textContent = 'EVA is typing...';
        } else {
            typingIndicator.textContent = `${data.nickname} is typing...`;
        }
        typingIndicator.classList.remove('hidden');
    });

    socket.on('user_stop_typing', (data) => {
        typingIndicator.textContent = '';
        typingIndicator.classList.add('hidden');
    });
});
