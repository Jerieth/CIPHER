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
    const sendButton = messageForm.querySelector('button[type="submit"]');
    const usernameDisplay = document.getElementById("username-display");

    let typingTimer;
    const doneTypingInterval = 1000;
    let inactivityTimer;
    const inactivityTimeout = 5 * 60 * 1000; // 5 minutes
    let isUsernameLocked = false;

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
        } else {
            cipherStatus.classList.remove("status-online");
            cipherStatus.classList.add("status-offline");
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

    socket.on("restart_chat", () => {
        chatMessages.innerHTML = "";
        unlockUsername();
        nicknameInput.value = "";
        messageInput.innerHTML = "";
        handleInitialDelay();
    });

    socket.on("receive_message", (data) => {
        const messageElement = document.createElement("div");
        const nicknameElement = document.createElement("span");
        nicknameElement.textContent = `${data.nickname}: `;
        nicknameElement.className = "font-bold text-blue-700 mr-2";
        messageElement.appendChild(nicknameElement);
        const messageTextElement = document.createElement("span");
        messageTextElement.innerHTML = data.message;
        messageTextElement.className = "break-words max-w-[90%]";
        messageElement.appendChild(messageTextElement);
        messageElement.className =
            "mb-2 p-2 bg-chat-bg rounded flex items-start text-base";
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        if (data.nickname === "CIPHER") {
            updateCipherStatus(true);
            resetInactivityTimer();
        }
    });

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
