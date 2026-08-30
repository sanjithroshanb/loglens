from collections import Counter
from detector import detect_attack
from geoip import lookup_ip


def analyze_logs(log_entries):
    """
    Analyze parsed log entries and generate dashboard statistics.
    """

    results = []
    attack_counts = Counter()
    attacker_counts = Counter()
    hourly_counts = Counter()
    failed_logins = Counter()

    # First pass: signature-based detection
    for log in log_entries:

        detection = detect_attack(log)

        result = {
            **log,
            "attack_type": detection["attack_type"],
            "severity": detection["severity"]
        }

        results.append(result)

        if detection["attack_type"]:
            attack_counts[detection["attack_type"]] += 1
            attacker_counts[log["ip"]] += 1

            hour = log["timestamp"][:13]
            hourly_counts[hour] += 1

        if log["status"] == 401:
            failed_logins[log["ip"]] += 1

    # Second pass: brute-force detection
    for ip, count in failed_logins.items():

        if count >= 5:

            for result in results:

                if result["ip"] == ip and result["status"] == 401:

                    result["attack_type"] = "brute_force"
                    result["severity"] = "high"

            attack_counts["brute_force"] += count
            attacker_counts[ip] = count

            # Add brute-force events to the timeline
            for result in results:
                if result["ip"] == ip and result["status"] == 401:
                    hour = result["timestamp"][:13]
                    hourly_counts[hour] += 1

    # Recalculate severity from final results
    severity_counts = Counter(
        result["severity"]
        for result in results
    )

    # Final attack count
    total_attacks = sum(
        1
        for result in results
        if result["attack_type"] is not None
    )

    high_severity = sum(
        1
        for result in results
        if result["severity"] == "high"
    )

    # Build top attacker list
    top_attackers = []

    for ip, count in attacker_counts.most_common(10):

        top_attackers.append({
            "ip": ip,
            "attack_count": count,
            "location": lookup_ip(ip)
        })

    return {
        "total_logs": len(results),
        "total_attacks": total_attacks,
        "high_severity": high_severity,

        "attack_types": dict(attack_counts),
        "severity": dict(severity_counts),

        "top_attackers": top_attackers,

        "attacks_per_hour": dict(hourly_counts),

        "results": results
    }
