const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());



// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/chat-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Failed to connect to MongoDB', err);
});

const MessageSchema = new mongoose.Schema({
  username: String,
  text: String,
  room: String,
  timestamp: { type: Date, default: Date.now },
});

const Message = mongoose.model('Message', MessageSchema);

app.get('/', (req, res) => {
  res.send('Server is running');
});

app.get('/messages/:room', async (req, res) => {
  const { room } = req.params;
  const messages = await Message.find({ room }).sort('timestamp');
  res.json(messages);
});

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('join', ({ username, room }) => {
    socket.join(room);
    console.log(`${username} joined ${room}`);
  });

  socket.on('message', async ({ username, text, room }) => {
    console.log("rr",username, text, room)
    const message = new Message({ username, text, room });
    await message.save();
    io.to(room).emit('message', message);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

server.listen(5000, () => {
  console.log('listening on *:5000');
});
