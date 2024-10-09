import subprocess
from app import app

def build_css():
    try:
        subprocess.run(["npm", "run", "build-css"], check=True)
        print("CSS built successfully")
    except subprocess.CalledProcessError as e:
        print(f"Error building CSS: {e}")

if __name__ == "__main__":
    build_css()
    app.run(host="0.0.0.0", port=5000)
