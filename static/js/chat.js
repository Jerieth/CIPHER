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
});
