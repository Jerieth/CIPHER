import os
import time
import random
from flask import Flask, render_template
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get("FLASK_SECRET_KEY") or "a secret key"
socketio = SocketIO(app)

EVA_RESPONSES = [
    "That's interesting, {}! Could you tell me more about that?",
    "I see, {}. Have you considered the implications of that statement?",
    "That's a unique perspective, {}. How did you come to that conclusion?",
    "Fascinating input, {}! Can you provide more context?",
    "I'm intrigued, {}. What led you to think about this topic?",
]

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('connect')
def handle_connect():
    time.sleep(1)  # Short delay before greeting
    greeting = "Hello, I am EVA your ship's AI. May I ask your name?"
    emit('receive_message', {'message': greeting, 'nickname': 'EVA'})

@socketio.on('send_message')
def handle_message(data):
    message = data['message']
    nickname = data['nickname']
    emit('receive_message', {'message': message, 'nickname': nickname})
    
    # Delayed EVA response
    socketio.start_background_task(send_eva_response, nickname)

def send_eva_response(user_name):
    socketio.emit('user_typing', {'nickname': 'EVA'})
    time.sleep(random.uniform(1, 3))  # Random delay between 1 and 3 seconds
    eva_message = random.choice(EVA_RESPONSES).format(user_name)
    socketio.emit('user_stop_typing', {'nickname': 'EVA'})
    socketio.emit('receive_message', {'message': eva_message, 'nickname': 'EVA'})

if __name__ == '__main__':
    socketio.run(app, host="0.0.0.0", port=5000, allow_unsafe_werkzeug=True)
