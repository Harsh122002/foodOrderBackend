# Use an official Node.js runtime as a parent image
FROM node:20

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and package-lock.json files to the working directory
COPY package*.json ./
COPY package-lock.json ./


# Copy the .env file to the working directory
COPY .env .env

# Install the project dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .


# Ensure port 5000 is available to the world outside this container
EXPOSE 5000

# Define environment variable
ENV PORT=5000

# Run the app
CMD ["node", "app.js"]
