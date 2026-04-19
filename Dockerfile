FROM node:24.15-alpine as base

WORKDIR /home/app

COPY package.json .
RUN npm install

# Install application into container
COPY . .

# Run the application
EXPOSE 3000
CMD ["npm", "run", "start"]