ARG NODE_VERSION=16
ARG ALPINE_VERSION=
ARG BUILD_DATE

FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS production-dependencies
USER node
WORKDIR /home/node

COPY --chown=node:node ["package*.json", "./"]
RUN npm clean-install --omit=dev

FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS builder

USER node
WORKDIR /home/node

# Copy pre-built dist folder from context (built in CI)
# This avoids rebuilding for each architecture under QEMU emulation
COPY --chown=node:node ["dist/", "dist/"]

FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS runtime-production

USER node
WORKDIR /home/node

COPY --chown=node:node --from=production-dependencies ["/home/node/node_modules", "node_modules/"]
COPY --chown=node:node --from=builder ["/home/node/dist", "dist/"]
COPY --chown=node:node ["server/", "./server"]
COPY --chown=node:node ["public/", "./public"]

CMD [ "node", "server/start.js" ]