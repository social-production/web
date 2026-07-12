FROM node:22-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_BACKEND=fastapi
ARG VITE_API_URL=http://localhost:8000
ENV VITE_BACKEND=$VITE_BACKEND
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM node:22-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules

EXPOSE 3000
CMD ["node", "build"]
