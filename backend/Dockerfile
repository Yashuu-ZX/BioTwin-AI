# Layer 5: Enterprise Containerization
FROM node:18-alpine

# Set Working Directory
WORKDIR /usr/src/app

# Only copy package dependencies first for layer caching
COPY package*.json ./
RUN npm ci --only=production

# Bundle source code
COPY . .

# Environment Defaults (Override via Azure/AWS/Vercel)
ENV NODE_ENV=production
ENV PORT=8080

# Expose Gateway Port
EXPOSE 8080

# Launch BioTwin AI Node Server
CMD [ "node", "server.js" ]
