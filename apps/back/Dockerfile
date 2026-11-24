# Build en una etapa aparte para que la imagen final no cargue con Maven ni el
# código fuente: solo el JRE y el jar.
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /build
# Las dependencias se cachean por separado del código: cambiar una clase Java no
# vuelve a descargar todo Maven.
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src ./src
RUN mvn -q -B -DskipTests package

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /build/target/*.jar app.jar
RUN mkdir -p /app/uploads
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
