// backend/sockets/socketHandler.js

let ioInstance = null;

// Initialize socket handler with io instance
const initSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Join a ward room
    socket.on('join:ward', (ward) => {
      socket.join(ward);
      console.log(`Socket ${socket.id} joined ward: ${ward}`);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
};

// Emit event to all connected clients
const emitToAll = (event, data) => {
  if (ioInstance) {
    ioInstance.emit(event, data);
  }
};

// Emit event to a specific ward room
const emitToWard = (ward, event, data) => {
  if (ioInstance) {
    ioInstance.to(ward).emit(event, data);
  }
};

module.exports = { initSocket, emitToAll, emitToWard };
