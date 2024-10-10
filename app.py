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
        greeting1 = 'Hello, I am CIPHER (Cognitive Interface for Personal Help and Extended Resources).'
        greeting2 = 'How can I help you today?'
        
        emit('receive_message', {'message': greeting1, 'nickname': 'CIPHER'}, broadcast=True)
        socketio.sleep(1)  # Short delay between messages
        emit('receive_message', {'message': greeting2, 'nickname': 'CIPHER'}, broadcast=True)
        greeting_sent = True

def send_cipher_response(user_name, user_message):
    socketio.emit('user_typing', {'nickname': 'CIPHER'})
    time.sleep(random.uniform(1, 3))  # Random delay between 1 and 3 seconds
    
    cipher_message = get_voiceflow_response(user_message)
    
    socketio.emit('user_stop_typing', {'nickname': 'CIPHER'})
    socketio.emit('receive_message', {'message': cipher_message, 'nickname': 'CIPHER'})

def get_voiceflow_response(user_message):
    voiceflow_api_url = "https://general-runtime.voiceflow.com/state/user/123/interact"
    headers = {
        "Authorization": "VF.DM.67071c896b9fc85a0cde90bb.tESZFXwTBbku1VQj",
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
        
        return ""  # Return an empty string if no response is found
    except requests.RequestException as e:
        print(f"Error calling Voiceflow API: {e}")
        return ""  # Return an empty string in case of an error

if __name__ == '__main__':
    socketio.run(app, host="0.0.0.0", port=5000)
