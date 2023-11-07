FROM node:latest

# # Install Yarn
# RUN npm install -g yarn

# Install FFmpeg
RUN apt-get update && \
  apt-get install -y ffmpeg

# Set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install the dependencies
RUN yarn install

# Copy the rest of the application files
COPY . .

# Start the application
CMD ["yarn", "start"]