const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
require('dotenv').config();
const documentRoutes = require('./routes/documentRoutes');
const codeReviewRoutes = require('./routes/codeReviewRoutes');

// Initialize express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Keep track of active users in rooms
const documentUsers = new Map();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());
app.use('/api/auth', authRoutes); 
app.use('/api/documents', documentRoutes);
app.use('/api/code-review', codeReviewRoutes);

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/codesynth')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Basic route
app.get('/', (req, res) => {
  res.send('CodeSynth API is running');
});

// Socket.IO handlers
io.on('connection', (socket) => {
  console.log('New client connected', socket.id);
  
  // Join document room with user data
  socket.on('join-document', async ({ documentId, userId, username }) => {
    socket.join(documentId);
    
    // Store user data in socket session
    socket.userData = { userId, username, documentId };
    
    // Update document users map
    if (!documentUsers.has(documentId)) {
      documentUsers.set(documentId, new Map());
    }
    documentUsers.get(documentId).set(userId, { socketId: socket.id, username });
    
    // Notify others in the room about the new user
    socket.to(documentId).emit('user-joined', {
      _id: userId,
      username,
      socketId: socket.id
    });
    
    // Send the current list of users in the room to the new user
    const userList = Array.from(documentUsers.get(documentId).entries())
      .map(([id, data]) => ({
        _id: id,
        username: data.username,
        socketId: data.socketId
      }));
    
    socket.emit('active-users', userList);
    
    console.log(`Socket ${socket.id} joined document: ${documentId}`);
  });
  
  // Handle code changes
  socket.on('code-change', (data) => {
    socket.to(data.documentId).emit('receive-changes', data.code);
  });
  
  // Handle cursor position updates
  socket.on('cursor-update', (data) => {
    socket.to(data.documentId).emit('cursor-move', {
      userId: data.userId,
      position: data.position,
      selections: data.selections
    });
  });
  
  // Handle explicit document leave
  socket.on('leave-document', ({ documentId, userId }) => {
    handleUserLeaveDocument(socket, documentId, userId);
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    if (socket.userData) {
      const { documentId, userId } = socket.userData;
      handleUserLeaveDocument(socket, documentId, userId);
    }
    console.log('Client disconnected', socket.id);
  });
});

// Helper function to handle a user leaving a document
function handleUserLeaveDocument(socket, documentId, userId) {
  if (documentId && userId) {
    socket.leave(documentId);
    
    // Remove user from document users map
    if (documentUsers.has(documentId)) {
      documentUsers.get(documentId).delete(userId);
      
      // Delete document entry if no users left
      if (documentUsers.get(documentId).size === 0) {
        documentUsers.delete(documentId);
      }
    }
    
    // Notify others that user has left
    socket.to(documentId).emit('user-left', userId);
  }
}

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
