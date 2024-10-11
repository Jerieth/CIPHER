document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    const chatMessages = document.getElementById('chat-messages');
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    const nicknameInput = document.getElementById('nickname-input');
    const changeUserBtn = document.getElementById('change-user-btn');
    const restartChatBtn = document.getElementById('restart-chat-btn');
    const fullScreenBtn = document.getElementById('full-screen-btn');
    const disconnectBtn = document.getElementById('disconnect-btn');

    let isUsernameLocked = false;

    messageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (messageInput.value && nicknameInput.value) {
            socket.emit('send_message', { message: messageInput.value, nickname: nicknameInput.value });
            messageInput.value = '';
            if (!isUsernameLocked) {
                nicknameInput.readOnly = true;
                isUsernameLocked = true;
            }
        }
    });

    socket.on('receive_message', (data) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', data.nickname === 'CIPHER' ? 'cipher-message' : 'user-message');
        messageElement.textContent = `${data.nickname}: ${data.message}`;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });

    changeUserBtn.addEventListener('click', () => {
        nicknameInput.readOnly = false;
        isUsernameLocked = false;
        nicknameInput.value = '';
        nicknameInput.focus();
    });

    restartChatBtn.addEventListener('click', () => {
        chatMessages.innerHTML = '';
        nicknameInput.readOnly = false;
        isUsernameLocked = false;
        nicknameInput.value = '';
        nicknameInput.focus();
        socket.emit('restart_chat');
    });

    fullScreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    });

    disconnectBtn.addEventListener('click', () => {
        socket.disconnect();
        chatMessages.innerHTML += '<div class="system-message">Disconnected from server</div>';
    });

    socket.on('connect', () => {
        chatMessages.innerHTML += '<div class="system-message">Connected to server</div>';
    });

    socket.on('disconnect', () => {
        chatMessages.innerHTML += '<div class="system-message">Disconnected from server</div>';
    });
});
