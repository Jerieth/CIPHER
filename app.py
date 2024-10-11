import os
from flask import Flask, render_template, abort
from flask_socketio import SocketIO, emit
import time
import random

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/manager.js')
def manager_js():
    abort(404)  # Return 404 for any requests to manager.js

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('send_message')
def handle_message(data):
    message = data['message']
    nickname = data['nickname']
    emit('receive_message', {'message': message, 'nickname': nickname}, broadcast=True)
    
    # Simulate CIPHER's response
    socketio.start_background_task(send_cipher_response, nickname)

def send_cipher_response(user_name):
    time.sleep(random.uniform(1, 3))  # Random delay between 1 and 3 seconds
    responses = [
        f"Thank you for your message, {user_name}. How can I assist you today?",
        f"Greetings, {user_name}. What would you like to know about the EVA mission?",
        f"Hello {user_name}, I'm here to help with any questions about our space exploration efforts.",
        f"{user_name}, your input is valuable. What aspect of the mission would you like to discuss?",
        f"Welcome, {user_name}. I'm ready to provide information on our current space technologies and missions."
    ]
    cipher_message = random.choice(responses)
    socketio.emit('receive_message', {'message': cipher_message, 'nickname': 'CIPHER'})

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000)
