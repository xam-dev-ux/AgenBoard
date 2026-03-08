FROM node:20-alpine

WORKDIR /app

# Copy workspace manifests
COPY package.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY packages/agent/package.json packages/agent/package.json

# Install dependencies
RUN npm install --workspace=packages/shared --workspace=packages/agent --ignore-scripts

# Copy source
COPY packages/shared packages/shared
COPY packages/agent packages/agent

# Build shared first, then agent
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=packages/agent

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost:3001/api/stats || exit 1

CMD ["node", "packages/agent/dist/index.js"]
