# 使用官方的 Nginx 镜像作为基础镜像
FROM hub.tiduyun.com:5000/steamer-15/zgkj-test/nginx:v7
WORKDIR /usr/share/nginx/html
COPY ./ .
EXPOSE 80