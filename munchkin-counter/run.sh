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

# https on a second port, with a self-made certificate, so tablets can keep the screen on
# (browsers only allow that on secure pages). Made once, and again if the address changes.
export HTTPS_PORT=3443
export TLS_CERT="/data/tls/cert.pem"
export TLS_KEY="/data/tls/key.pem"
ADDRESS="${HOST_IP:-$(node --input-type=module -e 'import { lanAddress } from "/app/src/network.js"; console.log(lanAddress())')}"
if [ ! -f "${TLS_CERT}" ] || ! openssl x509 -in "${TLS_CERT}" -noout -ext subjectAltName 2>/dev/null \
        | grep -qE "IP Address:${ADDRESS}(,|$)"; then
    bashio::log.info "Creating an https certificate for ${ADDRESS}..."
    mkdir -p /data/tls
    openssl req -x509 -newkey rsa:2048 -nodes -days 3650 \
        -keyout "${TLS_KEY}" -out "${TLS_CERT}" -subj "/CN=Munchkin Counter" \
        -addext "subjectAltName=IP:${ADDRESS},DNS:homeassistant.local,DNS:localhost" \
        -addext "basicConstraints=critical,CA:TRUE" \
        -addext "keyUsage=critical,digitalSignature,keyEncipherment,keyCertSign" \
        -addext "extendedKeyUsage=serverAuth" 2>/dev/null
fi

bashio::log.info "Starting Munchkin Counter on port ${PORT} (https ${HTTPS_PORT})..."
exec node /app/src/server.js
