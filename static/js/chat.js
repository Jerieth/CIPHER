document.addEventListener("DOMContentLoaded", () => {
    const socket = io('ws://cipher.sctds.com');
    const chatMessages = document.getElementById("chat-messages");
    const messageForm = document.getElementById("message-form");
    const messageInput = document.getElementById("message-input");
    const nicknameInput = document.getElementById("nickname-input");
    const typingIndicator = document.getElementById("typing-indicator");
    const cipherStatus = document.getElementById("cipher-status");
    const changeUserBtn = document.getElementById("change-user-btn");
    const restartChatBtn = document.getElementById("restart-chat-btn");
    const fullScreenBtn = document.getElementById("full-screen-btn");
    const disconnectBtn = document.getElementById("disconnect-btn");
    const sendButton = messageForm.querySelector('button[type="submit"]');
    const usernameDisplay = document.getElementById("username-display");
    const disconnectedText = document.getElementById("disconnected-text");
    const powerButton = document.getElementById("power-button");
    const reconnectText = document.getElementById("reconnect-text");

    let typingTimer;
    const doneTypingInterval = 1000;
    let isUsernameLocked = false;
    let isFullScreen = false;

    function handleInitialDelay() {
        updateCipherStatus(false);
        disableUserInput(true);

        displayOfflineMessage("CIPHER powering on. Please Stand By.");

        setTimeout(() => {
            updateCipherStatus(true);
            removeOfflineMessage();

            displayWarningMessage(
                "Ask a question, and I'll use the knowledge you provided to respond.<br><br>Please be aware: asking certain questions may result in some minor story spoilers.",
            );

            setTimeout(() => {
                removeWarningMessage();
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
        disconnectBtn.disabled = disable;
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
            removeOfflineMessage();
            powerButton.style.display = "none";
            reconnectText.style.display = "none";
            disconnectBtn.textContent = "Disconnect";
        } else {
            cipherStatus.classList.remove("status-online");
            cipherStatus.classList.add("status-offline");
            disconnectedText.style.display = "inline";
            powerButton.style.display = "inline-block";
            reconnectText.style.display = "inline";
            disconnectBtn.textContent = "Connect";
        }
    }

    function displayOfflineMessage(message) {
        removeOfflineMessage();
        powerButton.style.display = "none";
        reconnectText.style.display = "none";
        const offlineMessage = document.createElement("div");
        offlineMessage.id = "cipher-offline-message";
        offlineMessage.innerHTML = message;
        offlineMessage.className =
            "text-red-500 text-center my-4 text-2xl font-bold p-4 bg-black bg-opacity-80 rounded-lg shadow-lg";
        chatMessages.appendChild(offlineMessage);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function removeOfflineMessage() {
        const offlineMsg = document.getElementById("cipher-offline-message");
        if (offlineMsg) offlineMsg.remove();
    }

    function displayWarningMessage(message) {
        const warningMessage = document.createElement("div");
        warningMessage.id = "cipher-warning-message";
        warningMessage.innerHTML = message;
        warningMessage.className =
            "text-red-500 text-center my-4 text-xl font-bold p-4 bg-black bg-opacity-80 rounded-lg shadow-lg";
        chatMessages.appendChild(warningMessage);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function removeWarningMessage() {
        const warningMsg = document.getElementById("cipher-warning-message");
        if (warningMsg) warningMsg.remove();
    }

    function lockUsername() {
        isUsernameLocked = true;
        usernameDisplay.textContent = nicknameInput.value;
        usernameDisplay.classList.remove("hidden");
        nicknameInput.classList.add("hidden");
        changeUserBtn.textContent = "Change User";
        changeUserBtn.classList.remove("hidden");
        typingTimer = null;

        socket.emit("clear_chat_history");
        socket.emit("request_cipher_greeting");
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
        }
    });

    messageInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            messageForm.dispatchEvent(new Event("submit"));
        }
    });

    changeUserBtn.addEventListener("click", () => {
        unlockUsername();
    });

    restartChatBtn.addEventListener("click", () => {
        socket.emit("restart_chat");
        restartChat();
    });

    fullScreenBtn.addEventListener("click", () => {
        toggleFullScreen();
    });

    powerButton.addEventListener("click", () => {
        updateCipherStatus(true);
        socket.emit("request_cipher_greeting");
    });

    disconnectBtn.addEventListener("click", () => {
        const isOnline = cipherStatus.classList.contains("status-online");
        updateCipherStatus(!isOnline);
        if (!isOnline) {
            socket.emit("request_cipher_greeting");
        }
    });

    function toggleFullScreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => {
                console.log(
                    `Error attempting to enable full-screen mode: ${err.message}`,
                );
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

    function restartChat() {
        chatMessages.innerHTML = "";
    }

    socket.on("restart_chat", () => {
        restartChat();
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
        }
    });

    function formatMessage(message) {
        message = message.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        message = message.replace(/\*(.*?)\*/g, "<em>$1</em>");

        message = message.replace(/^- (.*?)$/gm, "<li>$1</li>");
        message = message.replace(/<li>.*?<\/li>/gs, "<ul>$&</ul>");

        message = message.replace(/\n/g, "<br>");

        return message;
    }

    socket.on("user_typing", (data) => {
        if (data.nickname === "CIPHER") {
            typingIndicator.textContent = "CIPHER is typing...";
            typingIndicator.classList.remove("hidden");
            updateCipherStatus(true);
        }
    });

    socket.on("user_stop_typing", (data) => {
        if (data.nickname === "CIPHER") {
            typingIndicator.textContent = "";
            typingIndicator.classList.add("hidden");
        }
    });
});
