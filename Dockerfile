# syntax=docker/dockerfile:1
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev
COPY src ./src
# Titles and tickets are operator content, mounted at /app/src/titles.
RUN printf '{"http":{"port":20110}}\n' > src/config.json && mkdir -p src/titles && chown -R node:node src
USER node
EXPOSE 20110
CMD ["node", "src/server.js"]
