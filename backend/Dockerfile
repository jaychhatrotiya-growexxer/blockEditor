FROM node:20-alpine

WORKDIR /app

# Copy package files from the workspace root (if needed) or just the backend folder
# Since it's a monorepo, we might need root package.json for workspace logic, 
# but for a standalone image, we can just use the backend's package.json.
COPY package.json package-lock.json ./

RUN npm install

# Copy prisma schema for generation
COPY prisma ./prisma/
RUN npx prisma generate --schema ./prisma/schema.prisma

# Copy source code
COPY . .

EXPOSE 4000

CMD ["npm", "start"]
