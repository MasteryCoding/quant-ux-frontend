ARG NODE_VERSION=16
ARG ALPINE_VERSION=

FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION}

USER node
WORKDIR /home/node

# Install production dependencies
COPY --chown=node:node ["package.json", "package-lock.json", "./"]
RUN npm clean-install --omit=dev

# Copy pre-built application (built in GitHub Actions)
COPY --chown=node:node ["dist/", "./dist/"]
COPY --chown=node:node ["server/", "./server"]
COPY --chown=node:node ["public/", "./public"]

CMD [ "node", "server/start.js" ]