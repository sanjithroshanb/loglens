from ipaddress import ip_address


# Demo mappings for public/example IP addresses.
# Private/local addresses are intentionally labeled as local.
DEMO_LOCATIONS = {
    "8.8.8.8": {
        "country": "United States",
        "country_code": "US"
    },
    "1.1.1.1": {
        "country": "Australia",
        "country_code": "AU"
    },
    "208.67.222.222": {
        "country": "United States",
        "country_code": "US"
    }
}


def lookup_ip(ip):
    """
    Return a safe location description for an IP address.

    Private/local IPs are not assigned a real geographic location.
    """

    if ip in DEMO_LOCATIONS:
        return DEMO_LOCATIONS[ip]

    try:
        address = ip_address(ip)

        if address.is_private or address.is_loopback:
            return {
                "country": "Local / Private Network",
                "country_code": "LOCAL"
            }

    except ValueError:
        return {
            "country": "Unknown",
            "country_code": "UNKNOWN"
        }

    return {
        "country": "Unknown",
        "country_code": "UNKNOWN"
    }
