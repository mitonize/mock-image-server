# How to build
# docker buildx create --use
# docker buildx build -t mitonize/mock-image-server:latest --push --platform linux/amd64,linux/arm64 .

FROM node:lts-alpine
ARG TARGETPLATFORM
ARG BUILDPLATFORM
RUN echo "I am running on $BUILDPLATFORM, building for $TARGETPLATFORM" > /log

ENV NODE_ENV production

WORKDIR /app
COPY --chown=node:node index.js palette.yml package.json package-lock.json .
RUN mkdir -p images

# .npm-deps https://github.com/Automattic/node-canvas/issues/866
RUN apk add --no-cache --virtual .build-deps build-base \
 && apk add --no-cache --virtual .npm-deps cairo libjpeg-turbo pango \
 && apk add --no-cache --virtual .npm-build-deps cairo-dev libjpeg-turbo-dev pango-dev \
 && apk add --no-cache dumb-init font-noto-cjk \
 && npm ci --omit-dev \
 && apk del .build-deps \
 && apk del .npm-build-deps

USER node
EXPOSE 3000
ENTRYPOINT ["dumb-init", "node", "index.js"]
