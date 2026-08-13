FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/backend/package.json ./packages/backend/package.json
COPY packages/frontend/package.json ./packages/frontend/package.json
COPY packages/cli/package.json ./packages/cli/package.json
RUN npm ci

FROM deps AS build
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY packages/frontend ./packages/frontend
RUN npm run build --workspace=@back-stage/shared
RUN npm run build --workspace=@back-stage/frontend

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/frontend/dist ./packages/frontend/dist
COPY --from=build /app/packages/frontend/package.json ./packages/frontend/package.json
COPY --from=build /app/packages/frontend/vite.config.ts ./packages/frontend/vite.config.ts
EXPOSE 5173
CMD ["npm", "run", "preview", "--workspace=@back-stage/frontend", "--", "--host", "0.0.0.0", "--port", "5173"]
