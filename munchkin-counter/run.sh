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

bashio::log.info "Starting Munchkin Counter on port ${PORT}..."
exec node /app/src/server.js
