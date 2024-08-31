# Use a imagem Node.js como base
FROM node:latest

# Instalar PNPM globalmente
RUN npm install -g pnpm

# Definir o diretório de trabalho no contêiner
WORKDIR /app

# Copiar os arquivos de dependências e instalar com PNPM
COPY package.json ./
RUN pnpm install

# Copiar o restante dos arquivos para o contêiner
COPY . .

# Compilar o TypeScript para JavaScript
RUN pnpm run build

# Usar a versão de produção da imagem para rodar a aplicação
# (Opcionalmente, você pode fazer o build em uma imagem separada e copiar apenas o dist)
FROM node:latest
WORKDIR /app
COPY --from=0 /app/dist ./dist
COPY --from=0 /app/node_modules ./node_modules

# Comando para rodar a aplicação compilada
CMD ["node", "dist/server.js"]