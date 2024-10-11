import os
import time
import random
from flask import Flask, render_template
from flask_socketio import SocketIO, emit
import requests
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get("FLASK_SECRET_KEY") or "a secret key"
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get("DATABASE_URL")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
socketio = SocketIO(app)

class ChatLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nickname = db.Column(db.String(100), nullable=False)
    message = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<ChatLog {self.nickname}: {self.message}>'

with app.app_context():
    db.create_all()

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
    
    # Log the message to the database
    chat_log = ChatLog(nickname=nickname, message=message)
    db.session.add(chat_log)
    db.session.commit()
    
    emit('receive_message', {'message': message, 'nickname': nickname}, broadcast=True)
    
    # Delayed CIPHER response
    socketio.start_background_task(send_cipher_response, nickname, message)

@socketio.on('restart_chat')
def handle_restart_chat():
    global who_are_you_count, greeting_sent
    who_are_you_count = 0
    greeting_sent = False
    emit('restart_chat', broadcast=True)
    socketio.sleep(1)
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
        socketio.sleep(1)
        emit('receive_message', {'message': greeting2, 'nickname': 'CIPHER'}, broadcast=True)
        greeting_sent = True

def send_cipher_response(user_name, user_message):
    socketio.emit('user_typing', {'nickname': 'CIPHER'})
    time.sleep(random.uniform(1, 3))
    
    cipher_message = get_voiceflow_response(user_message)
    
    # Log CIPHER's response to the database
    chat_log = ChatLog(nickname='CIPHER', message=cipher_message)
    db.session.add(chat_log)
    db.session.commit()
    
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

def export_schema():
    from sqlalchemy import create_engine
    from sqlalchemy.schema import CreateTable
    engine = create_engine(app.config['SQLALCHEMY_DATABASE_URI'])
    with engine.connect() as conn:
        create_table_sql = CreateTable(ChatLog.__table__).compile(conn)
    return str(create_table_sql)

@app.route('/export_schema')
def export_schema_route():
    return export_schema(), 200, {'Content-Type': 'text/plain'}

if __name__ == '__main__':
    socketio.run(app, host="0.0.0.0", port=5000)
