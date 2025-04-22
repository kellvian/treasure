FROM maven:3.8.5-openjdk-17-slim AS build

# 接收Maven镜像URL参数
ARG MAVEN_MIRROR_URL=https://repo.maven.apache.org/maven2

# 设置工作目录
WORKDIR /app

# 配置Maven使用镜像源
RUN echo '<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0 https://maven.apache.org/xsd/settings-1.0.0.xsd">' > /usr/share/maven/conf/settings.xml \
    && echo '  <mirrors>' >> /usr/share/maven/conf/settings.xml \
    && echo '    <mirror>' >> /usr/share/maven/conf/settings.xml \
    && echo '      <id>custom-mirror</id>' >> /usr/share/maven/conf/settings.xml \
    && echo '      <name>Custom Mirror Repository</name>' >> /usr/share/maven/conf/settings.xml \
    && echo '      <url>'$MAVEN_MIRROR_URL'</url>' >> /usr/share/maven/conf/settings.xml \
    && echo '      <mirrorOf>central</mirrorOf>' >> /usr/share/maven/conf/settings.xml \
    && echo '    </mirror>' >> /usr/share/maven/conf/settings.xml \
    && echo '  </mirrors>' >> /usr/share/maven/conf/settings.xml \
    && echo '</settings>' >> /usr/share/maven/conf/settings.xml

# 复制 pom.xml 文件
COPY pom.xml .

# 下载所有依赖项 (利用Docker缓存)
RUN mvn dependency:go-offline -B

# 复制源代码
COPY src ./src

# 构建应用
RUN mvn package -DskipTests

# 运行阶段
FROM openjdk:17-jdk-slim

WORKDIR /app

# 从构建阶段复制jar文件
COPY --from=build /app/target/*.jar app.jar

# 暴露端口
EXPOSE 8080

# 启动命令
ENTRYPOINT ["java", "-jar", "app.jar"] 