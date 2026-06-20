require('dotenv').config();
console.log("EMAIL_PASS:", process.env.EMAIL_PASS);
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const childRoutes = require('./routes/childRoutes');
const chatRoutes = require('./routes/chatRoutes');
const doctorChatRoutes = require('./routes/doctorChatRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const aiRoutes = require('./routes/aiRoutes');
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/ai', aiRoutes);

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/children', childRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/doctor-chat', doctorChatRoutes);
app.use('/api/doctor', doctorRoutes);



mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected Successfully');
  })
  .catch((err) => {
    console.error('Database Connection Error', err);
  });


const PORT = process.env.PORT|| 5000;

app.listen(PORT, () => {
  console.log(`Server is moving on port ${PORT} 🚀`);
});
