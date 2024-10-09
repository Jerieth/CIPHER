document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    const chatMessages = document.getElementById('chat-messages');
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');

    messageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (messageInput.value.trim()) {
            socket.emit('send_message', { message: messageInput.value });
            messageInput.value = '';
        }
    });

    socket.on('receive_message', (data) => {
        const messageElement = document.createElement('div');
        messageElement.textContent = data.message;
        messageElement.className = 'mb-2 p-2 bg-gray-200 rounded';
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });
});
