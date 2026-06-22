FROM node:22-alpine AS build

WORKDIR /app

ARG VITE_BRAND_NAME=StatusGate
ARG VITE_BRAND_LOGO_URL=
ARG VITE_BRAND_LOGO_URL_LIGHT=
ARG VITE_BRAND_LOGO_URL_DARK=
ARG VITE_BRAND_TAGLINE=Service status monitoring
ENV VITE_BRAND_NAME=$VITE_BRAND_NAME
ENV VITE_BRAND_LOGO_URL=$VITE_BRAND_LOGO_URL
ENV VITE_BRAND_LOGO_URL_LIGHT=$VITE_BRAND_LOGO_URL_LIGHT
ENV VITE_BRAND_LOGO_URL_DARK=$VITE_BRAND_LOGO_URL_DARK
ENV VITE_BRAND_TAGLINE=$VITE_BRAND_TAGLINE

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

RUN apk add --no-cache gettext

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
