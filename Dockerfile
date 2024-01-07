# STAGE 0
FROM node:lts-alpine

ENV NODE_ENV production

WORKDIR /usr/src/app
COPY --chown=node:node . .

# .npm-deps https://github.com/Automattic/node-canvas/issues/866
RUN apk add --no-cache --virtual .build-deps build-base \
 && apk add --no-cache --virtual .npm-deps cairo libjpeg-turbo pango \
 && apk add --no-cache --virtual .npm-build-deps cairo-dev libjpeg-turbo-dev pango-dev \
 && apk add --no-cache font-noto-cjk \
 && npm ci --omit-dev \
 && apk del .build-deps \
 && apk del .npm-build-deps

USER node
EXPOSE 3000
CMD ["dumb-init", "node", "index.js"]
