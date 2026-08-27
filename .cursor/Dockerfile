FROM node:20-bookworm

RUN corepack enable \
  && corepack prepare pnpm@10 --activate

# Cursor checks out the repo; do not COPY the project here.
WORKDIR /workspace
