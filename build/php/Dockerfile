ARG NODE_VERSION=16

FROM node:$NODE_VERSION-alpine AS node
FROM php:8.1-fpm-alpine

ARG WWWGROUP=1000
ARG NODE_VERSION=16
ARG POSTGRES_VERSION=14
ARG XDEBUG_VERSION=3.1.4

ENV DEBIAN_FRONTEND noninteractive
ENV TZ=UTC

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Install dependencies
# zip: libzip-dev
# gd: libjpeg-turbo-dev libpng-dev libwebp-dev freetype-dev
RUN apk --no-cache add \
        zip \
        curl \
        libzip-dev \
        libjpeg-turbo-dev \
        libpng-dev \
        libwebp-dev \
        freetype-dev

# Install node
COPY --from=node /usr/lib /usr/lib
COPY --from=node /usr/local/share /usr/local/share
COPY --from=node /usr/local/lib /usr/local/lib
COPY --from=node /usr/local/include /usr/local/include
COPY --from=node /usr/local/bin /usr/local/bin

# Install extensions
RUN docker-php-ext-install exif pcntl bcmath zip \
    && docker-php-ext-install -j$(nproc) pdo_mysql \
    && docker-php-ext-configure gd --with-freetype --with-jpeg && docker-php-ext-install gd

# Install composer
RUN php -r "readfile('https://getcomposer.org/installer');" | php -- --install-dir=/usr/bin/ --filename=composer 
ENV COMPOSER_MEMORY_LIMIT=-1

# Install xdebug
RUN apk --no-cache add --virtual .build-deps \
        g++ \
        autoconf \
        make && \
        curl https://pecl.php.net/get/xdebug-${XDEBUG_VERSION}.tgz --output xdebug-${XDEBUG_VERSION}.tgz &&  \
        tar xzf xdebug-${XDEBUG_VERSION}.tgz &&  \
        cd xdebug-${XDEBUG_VERSION} && \
        phpize && \
        ./configure &&  \
        make install && \
        docker-php-ext-enable xdebug && \
        apk del .build-deps

# Installs latest Chromium package.
RUN apk add --no-cache \
      libstdc++ \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont
# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Add user for application so we don't need --no-sandbox.
RUN addgroup -S www && adduser -S -G www www

# Copy existing application directory contents
COPY . /var/www/html

# Workspace
WORKDIR /var/www/html

# Run everything after as non-privileged user.
# USER www

# Expose port 9000 and start php-fpm server
EXPOSE 9000
CMD ["php-fpm"]