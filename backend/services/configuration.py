"""Small, explicit production configuration boundaries."""
import os
from urllib.parse import urlsplit


def allowed_origins():
    origins = []
    for value in os.environ.get('OPTIQ_ALLOWED_ORIGINS', '').split(','):
        value = value.strip()
        if not value:
            continue
        parsed = urlsplit(value)
        if (parsed.scheme not in {'http', 'https'} or not parsed.hostname
                or parsed.username or parsed.password or parsed.path or parsed.query
                or parsed.fragment or '*' in value):
            raise ValueError('OPTIQ_ALLOWED_ORIGINS must contain exact HTTP(S) origins without paths.')
        origins.append(value)
    return origins
