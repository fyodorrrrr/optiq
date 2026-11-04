"""Filter internal diagnostics at the public response/export boundary."""
import re

ANSI = re.compile(r'\x1b\[[0-?]*[ -/]*[@-~]')
# Omit the entire diagnostic line, including paths with spaces and their suffixes.
# Match absolute POSIX, Windows-drive, and UNC paths, but not ordinary HTTPS URLs.
LOCAL_PATH = re.compile(r'(?<![\w:/])/(?!/)[^\s/]|(?<!\w)[A-Za-z]:[\\/]|\\\\[^\s\\]')
CREDENTIAL = re.compile(
    r'''(?ix)\b(?:api[_-]?key|password|secret|(?:access[_-]?|refresh[_-]?)?token|authorization|cookie)["']?\s*[:=]'''
    r'|\bBearer\s+[A-Za-z0-9._~+/-]+|https?://[^/\s]+:[^@\s]+@'
)


def public_message(message, fallback='Could not complete the request. Check the input or server setup and retry.'):
    """Keep authored user guidance; never echo path-bearing diagnostics."""
    message = ANSI.sub('', message)
    return fallback if LOCAL_PATH.search(message) or CREDENTIAL.search(message) else message


def public_log(text):
    """Retain training progress while removing private diagnostic lines."""
    lines = []
    for line in text.splitlines():
        line = ANSI.sub('', line)
        if CREDENTIAL.search(line):
            lines.append('[Credential details omitted]')
        elif LOCAL_PATH.search(line):
            lines.append('[Local file details omitted]')
        else:
            lines.append(line)
    return '\n'.join(lines) + ('\n' if text.endswith('\n') else '')


def public_training(training):
    """Expose reproducibility values rather than arbitrary internal settings."""
    result = {key: value for key, value in training.items() if key != 'run_directory'}
    numeric = {'epochs', 'imgsz', 'batch', 'seed', 'workers', 'patience', 'deterministic', 'exist_ok', 'amp'}
    parameters = training.get('parameters', {})
    result['parameters'] = {key: value for key, value in parameters.items()
                            if key in numeric and isinstance(value, (int, float, bool))}
    if parameters.get('device') in {'cpu', 'mps'}:
        result['parameters']['device'] = parameters['device']
    if training.get('status') == 'failed':
        result['message'] = 'Local training or evaluation failed. Check the training log and server setup.'
    else:
        result['message'] = public_message(training.get('message', ''))
    return result
