document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    const chatMessages = document.getElementById('chat-messages');
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    const nicknameInput = document.getElementById('nickname-input');
    const typingIndicator = document.getElementById('typing-indicator');
    const evaStatus = document.getElementById('eva-status');
    const changeUserBtn = document.getElementById('change-user-btn');
    const restartChatBtn = document.getElementById('restart-chat-btn');

    let typingTimer;
    const doneTypingInterval = 1000;
    let inactivityTimer;
    const inactivityTimeout = 5 * 60 * 1000; // 5 minutes
    let isUsernameLocked = false;

    socket.on('connect', () => {
        console.log('Connected to server');
        updateEvaStatus(true);
    });

    function updateEvaStatus(isOnline) {
        if (isOnline) {
            evaStatus.classList.remove('status-offline');
            evaStatus.classList.add('status-online');
        } else {
            evaStatus.classList.remove('status-online');
            evaStatus.classList.add('status-offline');
        }
    }

    function resetInactivityTimer() {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
            updateEvaStatus(false);
        }, inactivityTimeout);
    }

    function lockUsername() {
        isUsernameLocked = true;
        nicknameInput.disabled = true;
        changeUserBtn.textContent = 'Change User';
    }

    function unlockUsername() {
        isUsernameLocked = false;
        nicknameInput.disabled = false;
        changeUserBtn.textContent = 'Lock Username';
    }

    messageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (messageInput.value.trim() && nicknameInput.value.trim()) {
            if (!isUsernameLocked) {
                lockUsername();
            }
            socket.emit('send_message', { message: messageInput.value, nickname: nicknameInput.value });
            messageInput.value = '';
            resetInactivityTimer();
        }
    });

    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            messageForm.dispatchEvent(new Event('submit'));
        }
        resetInactivityTimer();
    });

    changeUserBtn.addEventListener('click', () => {
        if (isUsernameLocked) {
            unlockUsername();
        } else {
            lockUsername();
        }
    });

    restartChatBtn.addEventListener('click', () => {
        chatMessages.innerHTML = '';
        unlockUsername();
        nicknameInput.value = '';
        messageInput.value = '';
        socket.emit('restart_chat');
    });

    socket.on('receive_message', (data) => {
        const messageElement = document.createElement('div');
        const nicknameElement = document.createElement('span');
        nicknameElement.textContent = `${data.nickname}: `;
        nicknameElement.className = 'font-bold text-blue-700 mr-2';
        messageElement.appendChild(nicknameElement);
        const messageTextElement = document.createElement('span');
        messageTextElement.textContent = data.message;
        messageTextElement.className = 'break-words max-w-[90%]';
        messageElement.appendChild(messageTextElement);
        messageElement.className = 'mb-2 p-2 bg-chat-bg rounded flex items-start text-base';
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        if (data.nickname === 'EVA') {
            updateEvaStatus(true);
            resetInactivityTimer();
        }
    });

    socket.on('user_typing', (data) => {
        if (data.nickname === 'EVA') {
            typingIndicator.textContent = 'EVA is typing...';
            typingIndicator.classList.remove('hidden');
            updateEvaStatus(true);
            resetInactivityTimer();
        }
    });

    socket.on('user_stop_typing', (data) => {
        if (data.nickname === 'EVA') {
            typingIndicator.textContent = '';
            typingIndicator.classList.add('hidden');
        }
    });

    // Initialize inactivity timer
    resetInactivityTimer();
});
