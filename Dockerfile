# ── Build stage ──────────────────────────────────────────────────────────────
# Installs all dependencies (including devDeps) and generates build artifacts:
#   - src/parser/parser.js        (peggy compiles grammar.pegjs)
#   - src/templates/vendor/       (monaco-editor copied from node_modules)
FROM node:22-slim AS builder

WORKDIR /app

COPY package.json ./
RUN npm install --ignore-scripts

COPY scripts/ ./scripts/
COPY src/ ./src/

RUN npm run prepare

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM node:22-slim

WORKDIR /app

# Production dependencies only (includes ffmpeg-static and playwright)
# Remove the `prepare` script so npm doesn't try to run it (peggy is a devDep
# and won't be present), while still allowing other postinstall scripts to run
# (e.g. ffmpeg-static needs its postinstall to place the binary).
COPY package.json ./
RUN npm pkg delete scripts.prepare && npm install --omit=dev

# Application source and CLI entry point
COPY src/ ./src/
COPY bin/ ./bin/

# Overlay the build artifacts generated in the builder stage
COPY --from=builder /app/src/parser/parser.js   ./src/parser/
COPY --from=builder /app/src/templates/vendor/  ./src/templates/vendor/

# Download Playwright's Chromium browser and install its OS-level dependencies
RUN npx playwright install --with-deps chromium

# Users mount their .pop scene files and output directory under /workspace
WORKDIR /workspace

ENTRYPOINT ["node", "/app/bin/popcorn.js"]
