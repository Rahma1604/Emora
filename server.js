require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors =require('cors');
const authRoutes=require('./routes/authRoutes');
const childRoutes = require('./routes/childRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth',authRoutes);
app.use('/api/children', childRoutes);
app.use('/api/chat', chatRoutes);

mongoose.connect('mongodb://localhost:27017/emora',{
    useNewUrlParser: true,
    useUnifiedTopology:true
}).then(() => {
    console.log("MongoDB Connected Successfully");})
    .catch((err) => {console.error("Database Connection Error", err);
});

const PORT =  5000;
app.listen(PORT, () => {
    console.log(`Server is moving on port ${PORT} 🚀`);
});