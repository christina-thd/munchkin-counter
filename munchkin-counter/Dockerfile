# Home Assistant passes BUILD_ARCH (amd64, aarch64, …). Newer Supervisors no longer pass
# BUILD_FROM, so default to the official base image for that architecture.
ARG BUILD_ARCH=amd64
ARG BUILD_FROM=ghcr.io/home-assistant/${BUILD_ARCH}-base:latest
FROM $BUILD_FROM

# Install Node.js, and openssl for the https certificate (made by run.sh)
RUN apk add --no-cache \
    nodejs \
    npm \
    openssl

# Install app dependencies, then the app
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund \
    && npm cache clean --force
COPY src ./src
COPY public ./public

# Copy run script
COPY run.sh /
RUN chmod a+x /run.sh

# Web interface: http (dashboard + phone controls) and https (keeps tablet screens on)
EXPOSE 3000/tcp 3443/tcp

# Runs as root: games are saved in /data, which Home Assistant mounts owned by root.
CMD [ "/run.sh" ]
