import os
import time
import random
from flask import Flask, render_template
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get("FLASK_SECRET_KEY") or "a secret key"
socketio = SocketIO(app)

who_are_you_count = 0
socketio.last_question = ""
greeting_sent = False

EVA_RESPONSES = [
    "That's interesting, {}! Could you tell me more about that?",
    "I see, {}. Have you considered the implications of that statement?",
    "That's a unique perspective, {}. How did you come to that conclusion?",
    "Fascinating input, {}! Can you provide more context?",
    "I'm intrigued, {}. What led you to think about this topic?",
    "Interesting question about ship weapons, {}! Did you know there are three primary types: lasers, missiles, and auto-cannons? Each has its unique advantages and disadvantages.",
    "Lasers are fascinating weapons, {}. They require power from the ship's core and are highly accurate. They're particularly effective against heavily shielded ships, especially ion-based shields.",
    "Missiles are versatile weapons, {}. They explode on impact or within a specified range, causing damage to both hull and ship systems. However, they're an exhaustible resource that needs to be preloaded.",
    "Auto-cannons are an interesting choice, {}. They have their own power system, making them reliable even when other systems are down. While less accurate, they're great against groups of small ships or sentry drones.",
    "When it comes to ship weapons, {} , it's all about balance. Lasers for accuracy and shield penetration, missiles for versatility, and auto-cannons for reliability. What's your preferred loadout?",
]

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('connect')
def handle_connect():
    pass

@socketio.on('send_message')
def handle_message(data):
    message = data['message']
    nickname = data['nickname']
    emit('receive_message', {'message': message, 'nickname': nickname}, to=None)
    
    # Delayed EVA response
    socketio.start_background_task(send_eva_response, nickname, message)

@socketio.on('restart_chat')
def handle_restart_chat():
    global who_are_you_count, greeting_sent
    who_are_you_count = 0
    greeting_sent = False
    socketio.last_question = ""
    emit('clear_chat', to=None)
    send_eva_greeting()

@socketio.on('request_eva_greeting')
def handle_request_eva_greeting():
    send_eva_greeting()

def send_eva_greeting():
    global greeting_sent
    if not greeting_sent:
        greeting = "Hello, I am EVA your ship's AI. May I ask your name?"
        emit('receive_message', {'message': greeting, 'nickname': 'EVA'}, to=None)
        greeting_sent = True

def send_eva_response(user_name, user_message):
    global who_are_you_count
    socketio.emit('user_typing', {'nickname': 'EVA'}, to=None)
    time.sleep(random.uniform(1, 3))  # Random delay between 1 and 3 seconds
    
    lower_message = user_message.lower()

    if any(greeting in lower_message for greeting in ['hello', 'hi', 'hey', 'greetings']):
        eva_message = "Hello, I am EVA your ship's AI."
    elif "self-aware" in lower_message or "self aware" in lower_message:
        eva_message = "You could argue that I am self aware, or my programming is so advanced I seem self aware. Are you self aware and possess free will?"
    elif lower_message == "yes" and "self aware" in socketio.last_question.lower():
        eva_message = "Interesting..."
    elif "who are you" in lower_message:
        who_are_you_count += 1
        if who_are_you_count == 1:
            eva_message = "My name is EVA and I am your ship's AI."
        else:
            eva_message = "Like I said before...My name is EVA and I am an AI."
    elif "what are you" in lower_message:
        eva_message = "I am an artificial intelligence device created by MAG systems. I work independently and can adapt to control the functions for any ship or MAG device."
    else:
        eva_message = random.choice(EVA_RESPONSES).format(user_name)
    
    socketio.last_question = eva_message  # Store the last question asked by EVA
    socketio.emit('user_stop_typing', {'nickname': 'EVA'}, to=None)
    socketio.emit('receive_message', {'message': eva_message, 'nickname': 'EVA'}, to=None)

if __name__ == '__main__':
    socketio.run(app, host="0.0.0.0", port=5000)
