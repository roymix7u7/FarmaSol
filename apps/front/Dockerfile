# Imagen de desarrollo: corre el dev server de Vite con HMR, porque el compose
# monta src/ como volumen para que los cambios se vean al instante.
FROM node:22-alpine
WORKDIR /app
# package.json + lock primero para cachear npm ci entre builds.
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
EXPOSE 5173
# --host expone el server fuera del contenedor (por defecto solo escucha en 127.0.0.1).
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
