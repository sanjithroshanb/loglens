from flask import Flask, request, jsonify
from flask_cors import CORS
from parser import parse_log_line
from aggregator import analyze_logs
from pathlib import Path

app = Flask(__name__)
CORS(app)

BASE_DIR = Path(__file__).resolve().parent
DEMO_LOG = BASE_DIR.parent / "data" / "demo.log"


@app.route("/")
def home():
    return jsonify({
        "message": "LogLens API is running!",
        "status": "success"
    })


def process_file(file):
    """
    Process a log file line-by-line.
    Works with both uploaded Flask files and normal Python files.
    """

    log_entries = []

    # Flask uploaded files have .stream
    if hasattr(file, "stream"):
        source = file.stream
    else:
        source = file

    for line in source:
        if isinstance(line, bytes):
            line = line.decode("utf-8", errors="ignore")

        parsed = parse_log_line(line)

        if parsed:
            log_entries.append(parsed)

    return log_entries

@app.route("/analyze", methods=["POST"])
def analyze():
    if "file" not in request.files:
        return jsonify({
            "error": "No log file uploaded"
        }), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({
            "error": "No file selected"
        }), 400

    try:
        logs = process_file(file)
        analysis = analyze_logs(logs)

        return jsonify(analysis)

    except Exception as error:
        return jsonify({
            "error": str(error)
        }), 500


@app.route("/demo", methods=["GET"])
def demo():
    try:
        if not DEMO_LOG.exists():
            return jsonify({
                "error": "Demo log file not found"
            }), 404

        with open(DEMO_LOG, "rb") as file:
            logs = process_file(file)

        analysis = analyze_logs(logs)

        return jsonify(analysis)

    except Exception as error:
        return jsonify({
            "error": str(error)
        }), 500


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5001,
        debug=True
    )
