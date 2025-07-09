FROM node:18-alpine

# 1) Directorio de trabajo
WORKDIR /usr/src/app

# 2) Copiamos package.json y package-lock.json (si lo usas)
COPY package*.json ./

# 3) Instalamos dependencias
RUN npm install

# 4) Copiamos el resto del código
COPY . .

# 5) Declaramos el puerto de healthcheck
EXPOSE 3000

# 6) Arrancamos el script
CMD ["node", "index.js"]
