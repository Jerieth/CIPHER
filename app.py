import os
import time
import random
from flask import Flask, render_template
from flask_socketio import SocketIO, emit
import requests

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get("FLASK_SECRET_KEY") or "a secret key"
socketio = SocketIO(app)

who_are_you_count = 0
greeting_sent = False

CIPHER_RESPONSES = [
    "That's interesting, {}! Could you tell me more about that?",
    "I see, {}. Have you considered the implications of that statement?",
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
    emit('receive_message', {'message': message, 'nickname': nickname}, broadcast=True)
    
    # Delayed CIPHER response
    socketio.start_background_task(send_cipher_response, nickname, message)

@socketio.on('restart_chat')
def handle_restart_chat():
    global who_are_you_count, greeting_sent
    who_are_you_count = 0
    greeting_sent = False
    emit('restart_chat', broadcast=True)
    socketio.sleep(1)  # Short delay to ensure client-side is ready
    send_cipher_greeting()

@socketio.on('request_cipher_greeting')
def handle_request_cipher_greeting():
    send_cipher_greeting()

def send_cipher_greeting():
    global greeting_sent
    if not greeting_sent:
        greeting1 = "Hello, I am CIPHER (Cognitive Interface for Personal Help and Extended Resources)."
        greeting2 = "How can I help you today?"
        greeting3 = "Ask a question, and I'll use the knowledge you provided to respond."
        greeting4 = "<b>Please be aware</b>: asking me certain questions may result in some <i>minor story spoilers</i>."
        
        emit('receive_message', {'message': greeting1, 'nickname': 'CIPHER'}, broadcast=True)
        socketio.sleep(1)  # Short delay between messages
        emit('receive_message', {'message': greeting2, 'nickname': 'CIPHER'}, broadcast=True)
        socketio.sleep(1)  # Short delay between messages
        emit('receive_message', {'message': greeting3, 'nickname': 'CIPHER'}, broadcast=True)
        socketio.sleep(1)  # Short delay between messages
        emit('receive_message', {'message': greeting4, 'nickname': 'CIPHER'}, broadcast=True)
        greeting_sent = True

def send_cipher_response(user_name, user_message):
    global who_are_you_count
    socketio.emit('user_typing', {'nickname': 'CIPHER'})
    time.sleep(random.uniform(1, 3))  # Random delay between 1 and 3 seconds
    
    lower_message = user_message.lower()

    if any(greeting in lower_message for greeting in ['hello', 'hi', 'hey', 'greetings']):
        cipher_message = "Hello, I am CIPHER"
    elif "my name is" in lower_message or "i am" in lower_message:
        name = user_message.split("is")[-1].strip() if "my name is" in lower_message else user_message.split("am")[-1].strip()
        cipher_message = f"It is a pleasure to meet you, {name}."
    elif "self-aware" in lower_message or "self aware" in lower_message:
        cipher_message = "You could argue that I am self aware, or my programming is so advanced I seem self aware. Are you self aware and possess free will?"
    elif lower_message == "yes" and "self aware" in lower_message:
        cipher_message = "Interesting..."
    elif "who are you" in lower_message:
        who_are_you_count += 1
        if who_are_you_count == 1:
            cipher_message = "My name is CIPHER and I am your ship's AI."
        else:
            cipher_message = "Like I said before...My name is CIPHER and I am an AI."
    elif "what are you" in lower_message:
        cipher_message = "I am an artificial intelligence device created by MAG systems. I work independently and can adapt to control the functions for any ship or MAG device."
    else:
        # Use Voiceflow API for responses that would have used the removed response
        cipher_message = get_voiceflow_response(user_message)
    
    socketio.emit('user_stop_typing', {'nickname': 'CIPHER'})
    socketio.emit('receive_message', {'message': cipher_message, 'nickname': 'CIPHER'})

def get_voiceflow_response(user_message):
    # Replace with your actual Voiceflow API endpoint and API key
    voiceflow_api_url = "https://general-runtime.voiceflow.com/state/user/123/interact"
    headers = {
        "Authorization": os.environ.get("VOICEFLOW_API_KEY"),
        "Content-Type": "application/json"
    }
    payload = {
        "action": {
            "type": "text",
            "payload": user_message
        }
    }
    
    try:
        response = requests.post(voiceflow_api_url, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        # Extract the response from Voiceflow
        for trace in data:
            if trace['type'] == 'speak' or trace['type'] == 'text':
                return trace['payload']['message']
        
        return "I'm not sure how to respond to that."
    except requests.RequestException as e:
        print(f"Error calling Voiceflow API: {e}")
        return "I'm having trouble processing that right now. Can you try again?"

if __name__ == '__main__':
    socketio.run(app, host="0.0.0.0", port=5000)
