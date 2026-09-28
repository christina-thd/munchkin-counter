# Home Assistant passes BUILD_ARCH (amd64, aarch64, …). Newer Supervisors no longer pass
# BUILD_FROM, so default to the official base image for that architecture.
ARG BUILD_ARCH=amd64
ARG BUILD_FROM=ghcr.io/home-assistant/${BUILD_ARCH}-base:latest
FROM $BUILD_FROM

# Install Node.js
RUN apk add --no-cache \
    nodejs \
    npm

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

# Web interface (tablet dashboard + phone controls)
EXPOSE 3000/tcp

# Runs as root: games are saved in /data, which Home Assistant mounts owned by root.
CMD [ "/run.sh" ]
