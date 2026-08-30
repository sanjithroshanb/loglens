import json
from pathlib import Path
from urllib.parse import unquote


SIGNATURE_FILE = Path(__file__).parent / "signatures" / "signatures.json"


def load_signatures():
    with open(SIGNATURE_FILE, "r", encoding="utf-8") as file:
        return json.load(file)


def detect_attack(log_data):
    """
    Detect attacks in a parsed log entry.
    """

    path = log_data.get("path", "")

    # Decode URL-encoded characters
    decoded_path = unquote(path)

    signatures = load_signatures()

    for attack_type, details in signatures.items():
        for pattern in details["patterns"]:

            if pattern.lower() in decoded_path.lower():
                return {
                    "attack_type": attack_type,
                    "severity": details["severity"]
                }

    return {
        "attack_type": None,
        "severity": "none"
    }
