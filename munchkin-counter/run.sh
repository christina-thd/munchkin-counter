#!/usr/bin/with-contenv bashio

# Games are kept in the add-on's persistent /data folder
export STATE_FILE="/data/state.json"
# Must match ingress_port in config.yaml
export PORT=3000

# Address shown in the QR code (auto-detected when empty)
if bashio::config.has_value 'host_ip'; then
    export HOST_IP="$(bashio::config 'host_ip')"
    bashio::log.info "QR code address set to ${HOST_IP}"
fi

# Your own logo: put logo.png (or .jpg, .webp, .svg) in the "share" folder, under munchkin-counter/
for logo in /share/munchkin-counter/logo.png /share/munchkin-counter/logo.jpg \
            /share/munchkin-counter/logo.jpeg /share/munchkin-counter/logo.webp /share/munchkin-counter/logo.svg; do
    if [ -f "${logo}" ]; then
        export LOGO_FILE="${logo}"
        bashio::log.info "Using custom logo ${logo}"
        break
    fi
done

# https on a second port, so tablets can keep the screen on (browsers only allow that on secure pages).
export HTTPS_PORT=3443

# With the "ssl" option: Home Assistant's own certificate (e.g. Let's Encrypt, in the ssl folder). Browsers
# trust it, so Android can also install the app; it's opened by its domain name, e.g. https://ha.example.com:3443.
# The server reloads it by itself when it's renewed.
# Only the file name counts, so "fullchain.pem", "/ssl/fullchain.pem" and the form Home Assistant's own
# HTTP settings use, "../../ssl/fullchain.pem", all mean the same file in the ssl folder.
if bashio::config.true 'ssl'; then
    CERTFILE="$(bashio::config 'certfile')"
    KEYFILE="$(bashio::config 'keyfile')"
    CERTFILE="/ssl/${CERTFILE##*/}"
    KEYFILE="/ssl/${KEYFILE##*/}"
    if [ -f "${CERTFILE}" ] && [ -f "${KEYFILE}" ]; then
        export TLS_CERT="${CERTFILE}"
        export TLS_KEY="${KEYFILE}"
        bashio::log.info "https with Home Assistant's certificate ${CERTFILE}"
    else
        bashio::log.warning "ssl is on, but ${CERTFILE} or ${KEYFILE} doesn't exist: using the add-on's own certificate"
    fi
fi
# The address shown for the secure page (the certificate's domain)
if bashio::config.has_value 'domain'; then
    export SECURE_HOST="$(bashio::config 'domain')"
fi

# Otherwise a self-made certificate: made once, and again if the address changes. Browsers warn about it once.
# It's a plain server certificate, valid only for this server (not a CA that could vouch for other sites);
# one made by an older version as a CA is replaced.
if [ -z "${TLS_CERT:-}" ]; then
    export TLS_CERT="/data/tls/cert.pem"
    export TLS_KEY="/data/tls/key.pem"
    ADDRESS="${HOST_IP:-$(node --input-type=module -e 'import { lanAddress } from "/app/src/network.js"; console.log(lanAddress())')}"
    if [ ! -f "${TLS_CERT}" ] \
        || ! openssl x509 -in "${TLS_CERT}" -noout -ext subjectAltName 2>/dev/null | grep -qE "IP Address:${ADDRESS}(,|$)" \
        || openssl x509 -in "${TLS_CERT}" -noout -ext basicConstraints 2>/dev/null | grep -q "CA:TRUE"; then
        bashio::log.info "Creating an https certificate for ${ADDRESS}..."
        mkdir -p /data/tls
        openssl req -x509 -newkey rsa:2048 -nodes -days 3650 \
            -keyout "${TLS_KEY}" -out "${TLS_CERT}" -subj "/CN=Munchkin Counter" \
            -addext "subjectAltName=IP:${ADDRESS},DNS:homeassistant.local,DNS:localhost" \
            -addext "basicConstraints=critical,CA:FALSE" \
            -addext "keyUsage=critical,digitalSignature,keyEncipherment" \
            -addext "extendedKeyUsage=serverAuth" 2>/dev/null
    fi
fi

bashio::log.info "Starting Munchkin Counter on port ${PORT} (https ${HTTPS_PORT})..."
exec node /app/src/server.js
