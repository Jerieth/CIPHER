@socketio.on('restart_chat')
def handle_restart_chat():
    global who_are_you_count, greeting_sent
    who_are_you_count = 0
    greeting_sent = False
    emit('restart_chat', broadcast=True)
    socketio.sleep(1)  # Short delay to ensure client-side is ready
    send_cipher_greeting()
