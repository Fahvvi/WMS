FROM php:8.3-fpm-alpine

# Trik sakti untuk mencegah error 'Bad address' saat tar extraction di QNAP
ENV TAR_OPTIONS="--no-same-owner --no-same-permissions"

# Install dependensi sistem Alpine, GD (untuk Excel & QR Code), dan PostgreSQL
RUN apk update && apk add --no-cache \
    postgresql-dev \
    libzip-dev \
    zip \
    unzip \
    git \
    curl \
    freetype-dev \
    libjpeg-turbo-dev \
    libpng-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo_pgsql pgsql zip bcmath gd

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www

# Beri akses ke user www-data
RUN chown -R www-data:www-data /var/www