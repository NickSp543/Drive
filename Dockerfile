# Use a small Linux base
FROM ubuntu:22.04

# Install compiler
RUN apt-get update && \
    apt-get install -y g++ make && \
    apt-get clean

# Environment variable for data directory
ENV DATA_DIR=/data
RUN mkdir -p /data

# Set app directory
WORKDIR /app

# Copy source code
COPY src/ ./src/

# Compile the server
RUN g++ -std=c++17 -pthread \
        src/InputChecker.cpp \
        src/Compressor.cpp \
        src/AddCommand.cpp \
        src/GetCommand.cpp \
        src/SearchCommand.cpp \
        src/DeleteCommand.cpp \
        src/Server.cpp \
        -I./src \
        -o server

# Expose the default port
EXPOSE 8080

# Default command: run server on port 8080
CMD ["./server", "8080"]