#!/bin/sh
set -eu
# Default to the transport peer rather than trusting caller-controlled headers.
# Configure only provider-verified proxy CIDRs after checking the real Render path.
set -- --no-proxy-headers
if [ -n "${OPTIQ_TRUSTED_PROXY_IPS:-}" ]; then
    case "$OPTIQ_TRUSTED_PROXY_IPS" in
        *\**) echo 'Refusing unrestricted proxy trust.' >&2; exit 1 ;;
    esac
    set -- --proxy-headers --forwarded-allow-ips "$OPTIQ_TRUSTED_PROXY_IPS"
fi
exec python -m uvicorn main:app --host 0.0.0.0 --port "${PORT:-10000}" \
    --workers 1 --limit-concurrency 8 --backlog 32 --timeout-keep-alive 5 \
    --timeout-graceful-shutdown 20 --no-access-log "$@"
