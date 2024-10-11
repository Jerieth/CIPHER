document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    const chatMessages = document.getElementById('chat-messages');
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    const nicknameInput = document.getElementById('nickname-input');

    messageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (messageInput.value && nicknameInput.value) {
            socket.emit('send_message', { message: messageInput.value, nickname: nicknameInput.value });
            messageInput.value = '';
        }
    });

    socket.on('receive_message', (data) => {
        const messageElement = document.createElement('div');
        messageElement.textContent = `${data.nickname}: ${data.message}`;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });

    socket.on('connect', () => {
        console.log('Connected to server');
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from server');
    });
});
