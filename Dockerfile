ARG NODE_VERSION=23

FROM node:${NODE_VERSION}-alpine AS base
WORKDIR /usr/src/app
EXPOSE 3000

FROM base AS dev
COPY package.json package-lock.json ./
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --include=dev --legacy-peer-deps
COPY . .
USER root
RUN chown -R node:node /usr/src/app/node_modules
USER node

CMD npx prisma generate && npx prisma db push && npm run dev

FROM base AS prod
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

USER node
COPY . .
CMD node src/index.js