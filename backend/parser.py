import re
from datetime import datetime


LOG_PATTERN = re.compile(
    r'(?P<ip>\S+) '
    r'\S+ \S+ '
    r'\[(?P<timestamp>[^\]]+)\] '
    r'"(?P<method>[A-Z]+) (?P<path>\S+) [^"]+" '
    r'(?P<status>\d{3}) '
    r'(?P<size>\S+) '
    r'"(?P<referrer>[^"]*)" '
    r'"(?P<user_agent>[^"]*)"'
)


def parse_log_line(line):
    """
    Parse one Apache/Nginx Common Log Format line.
    Returns a dictionary or None if the line is invalid.
    """

    match = LOG_PATTERN.match(line.strip())

    if not match:
        return None

    data = match.groupdict()

    try:
        timestamp = datetime.strptime(
            data["timestamp"],
            "%d/%b/%Y:%H:%M:%S %z"
        ).isoformat()
    except ValueError:
        timestamp = data["timestamp"]

    return {
        "ip": data["ip"],
        "timestamp": timestamp,
        "method": data["method"],
        "path": data["path"],
        "status": int(data["status"]),
        "user_agent": data["user_agent"]
    }
