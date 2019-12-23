FROM yiisoftware/yii2-php:7.3-apache

COPY . /app
RUN chown www-data:www-data /app/runtime/
RUN chown www-data:www-data /app/web/assets/
