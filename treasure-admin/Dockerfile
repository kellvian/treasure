FROM node:18-alpine as build

# 设置工作目录
WORKDIR /app

# 安装sharp所需的系统依赖
RUN apk add --no-cache python3 make g++ vips-dev

# 配置npm使用淘宝镜像
RUN npm config set registry https://registry.npmmirror.com \
    && npm config set sharp_binary_host https://npmmirror.com/mirrors/sharp \
    && npm config set sharp_libvips_binary_host https://npmmirror.com/mirrors/sharp-libvips

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 使用nginx作为生产服务器
FROM nginx:stable-alpine

# 将构建结果复制到nginx目录
COPY --from=build /app/dist /usr/share/nginx/html

# 复制nginx配置文件
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露80端口
EXPOSE 80

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]