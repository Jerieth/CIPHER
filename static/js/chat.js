document.addEventListener("DOMContentLoaded", () => {
    const socket = io();
    const chatMessages = document.getElementById("chat-messages");
    const messageForm = document.getElementById("message-form");
    const messageInput = document.getElementById("message-input");
    const nicknameInput = document.getElementById("nickname-input");
    const typingIndicator = document.getElementById("typing-indicator");
    const cipherStatus = document.getElementById("cipher-status");
    const changeUserBtn = document.getElementById("change-user-btn");
    const restartChatBtn = document.getElementById("restart-chat-btn");
    const fullScreenBtn = document.getElementById("full-screen-btn");
    const sendButton = messageForm.querySelector('button[type="submit"]');
    const usernameDisplay = document.getElementById("username-display");
    const disconnectedText = document.getElementById("disconnected-text");
    const powerButton = document.getElementById("power-button");

    let typingTimer;
    const doneTypingInterval = 1000;
    let inactivityTimer;
    const inactivityTimeout = 5 * 60 * 1000; // 5 minutes
    let isUsernameLocked = false;
    let isFullScreen = false;

    function handleInitialDelay() {
        updateCipherStatus(false);
        disableUserInput(true);

        const offlineMessage = document.createElement("div");
        offlineMessage.id = "cipher-offline-message";
        offlineMessage.textContent = "CIPHER powering on. Please Stand By.";
        offlineMessage.className =
            "text-red-500 text-center my-4 text-6xl font-bold absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10";
        chatMessages.appendChild(offlineMessage);

        setTimeout(() => {
            updateCipherStatus(true);
            const offlineMsg = document.getElementById(
                "cipher-offline-message"
            );
            if (offlineMsg) offlineMsg.remove();

            const warningMessage = document.createElement("div");
            warningMessage.id = "cipher-warning-message";
            warningMessage.innerHTML =
                "Ask a question, and I'll use the knowledge you provided to respond.<br><br>Please be aware: asking me certain questions may result in some minor story spoilers.";
            warningMessage.className =
                "text-red-500 text-center my-4 text-2xl font-bold absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10";
            chatMessages.appendChild(warningMessage);

            setTimeout(() => {
                const warningMsg = document.getElementById(
                    "cipher-warning-message"
                );
                if (warningMsg) warningMsg.remove();
                disableUserInput(false);
                socket.emit("request_cipher_greeting");
            }, 10000);
        }, 5000);
    }

    function disableUserInput(disable) {
        messageInput.contentEditable = !disable;
        sendButton.disabled = disable;
        nicknameInput.disabled = disable;
        changeUserBtn.disabled = disable;
    }

    socket.on("connect", () => {
        console.log("Connected to server");
        handleInitialDelay();
    });

    function updateCipherStatus(isOnline) {
        if (isOnline) {
            cipherStatus.classList.remove("status-offline");
            cipherStatus.classList.add("status-online");
            disconnectedText.style.display = "none";
            powerButton.style.display = "none";
        } else {
            cipherStatus.classList.remove("status-online");
            cipherStatus.classList.add("status-offline");
            disconnectedText.style.display = "inline";
            powerButton.style.display = "inline-block";
        }
    }

    function resetInactivityTimer() {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
            updateCipherStatus(false);
        }, inactivityTimeout);
    }

    function lockUsername() {
        isUsernameLocked = true;
        usernameDisplay.textContent = nicknameInput.value;
        usernameDisplay.classList.remove("hidden");
        nicknameInput.classList.add("hidden");
        changeUserBtn.textContent = "Change User";
        changeUserBtn.classList.remove("hidden");
    }

    function unlockUsername() {
        isUsernameLocked = false;
        usernameDisplay.classList.add("hidden");
        nicknameInput.classList.remove("hidden");
        nicknameInput.value = "";
        changeUserBtn.classList.add("hidden");
    }

    messageForm.addEventListener("submit", (e) => {
        e.preventDefault();
        if (messageInput.textContent.trim() && nicknameInput.value.trim()) {
            if (!isUsernameLocked) {
                lockUsername();
            }
            socket.emit("send_message", {
                message: messageInput.innerHTML,
                nickname: nicknameInput.value,
            });
            messageInput.innerHTML = "";
            resetInactivityTimer();
        }
    });

    messageInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            messageForm.dispatchEvent(new Event("submit"));
        }
        resetInactivityTimer();
    });

    changeUserBtn.addEventListener("click", () => {
        unlockUsername();
    });

    restartChatBtn.addEventListener("click", () => {
        socket.emit("restart_chat");
    });

    fullScreenBtn.addEventListener("click", () => {
        toggleFullScreen();
    });

    powerButton.addEventListener("click", () => {
        updateCipherStatus(true);
        socket.emit("request_cipher_greeting");
    });

    function toggleFullScreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => {
                console.log(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }

    document.addEventListener("fullscreenchange", () => {
        if (document.fullscreenElement) {
            fullScreenBtn.textContent = "Exit Full Screen";
            isFullScreen = true;
        } else {
            fullScreenBtn.textContent = "Full Screen";
            isFullScreen = false;
        }
    });

    socket.on("restart_chat", () => {
        chatMessages.innerHTML = "";
        unlockUsername();
        nicknameInput.value = "";
        messageInput.innerHTML = "";
        updateCipherStatus(false);
        handleInitialDelay();
        isUsernameLocked = false;
        changeUserBtn.classList.add("hidden");
    });

    socket.on("receive_message", (data) => {
        const messageElement = document.createElement("div");
        const nicknameElement = document.createElement("span");
        nicknameElement.textContent = `${data.nickname}: `;
        nicknameElement.className = "font-bold text-blue-700 mr-2";
        messageElement.appendChild(nicknameElement);

        const messageTextElement = document.createElement("div");
        messageTextElement.innerHTML = formatMessage(data.message);
        messageTextElement.className = "message-content break-words";
        messageElement.appendChild(messageTextElement);

        messageElement.className =
            "message mb-4 p-4 bg-chat-bg rounded-lg shadow-md";
        
        if (data.nickname === "CIPHER") {
            messageElement.classList.add("cipher-message");
        } else {
            messageElement.classList.add("user-message");
        }

        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        if (data.nickname === "CIPHER") {
            updateCipherStatus(true);
            resetInactivityTimer();
        }
    });

    function formatMessage(message) {
        // Convert markdown-style formatting to HTML
        message = message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        message = message.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Convert bullet points
        message = message.replace(/^- (.*?)$/gm, '<li>$1</li>');
        message = message.replace(/<li>.*?<\/li>/gs, '<ul>$&</ul>');
        
        // Preserve line breaks
        message = message.replace(/\n/g, '<br>');
        
        return message;
    }

    socket.on("user_typing", (data) => {
        if (data.nickname === "CIPHER") {
            typingIndicator.textContent = "CIPHER is typing...";
            typingIndicator.classList.remove("hidden");
            updateCipherStatus(true);
            resetInactivityTimer();
        }
    });

    socket.on("user_stop_typing", (data) => {
        if (data.nickname === "CIPHER") {
            typingIndicator.textContent = "";
            typingIndicator.classList.add("hidden");
        }
    });

    // Initialize inactivity timer
    resetInactivityTimer();
});
