# Builds the static site and serves it with nginx.
#
# Fixture content (default, no credentials needed):
#   docker build -t thv-headless .
# Live Kontent content, with the project settings in .env:
#   DOCKER_BUILDKIT=1 docker build --build-arg KONTENT_MOCK=0 \
#     --secret id=dotenv,src=.env -t thv-headless .

FROM node:22-bookworm AS build
WORKDIR /app
ENV GATSBY_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ARG KONTENT_MOCK=1
ENV KONTENT_MOCK=${KONTENT_MOCK}
# The .env secret is only mounted for this step and never stored in a layer.
RUN --mount=type=secret,id=dotenv,target=/app/.env,required=false \
    npm test -- --ci && npx gatsby build

FROM nginx:1.30-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/public /usr/share/nginx/html
EXPOSE 80
