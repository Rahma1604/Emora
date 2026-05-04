require('dotenv').config();
console.log("EMAIL_PASS:", process.env.EMAIL_PASS);
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const childRoutes = require('./routes/childRoutes');
const chatRoutes = require('./routes/chatRoutes');
const doctorChatRoutes = require('./routes/doctorChatRoutes');

const app = express();

app.use(cors());
app.use(express.json());


app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/children', childRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/doctor-chat', doctorChatRoutes);

mongoose
  .connect('mongodb://127.0.0.1:27017/emora')
  .then(() => {
    console.log('MongoDB Connected Successfully');
  })
  .catch((err) => {
    console.error('Database Connection Error', err);
  });

const PORT = 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is moving on port ${PORT} 🚀`);
});