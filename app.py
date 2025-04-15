from flask import Flask, render_template
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config["SECRET_KEY"] = "secret!"
socketio = SocketIO(app)

players = {}

@app.route("/")
def index():
    return render_template("index.html")

@socketio.on("connect")
def handle_connect():
    print("A player connected.")

@socketio.on("disconnect")
def handle_disconnect():
    print("A player disconnected.")

@socketio.on("update")
def handle_update(data):
    players[data["id"]] = data
    emit("update", players, broadcast=True)

if __name__ == "__main__":
    socketio.run(app, debug=True)
