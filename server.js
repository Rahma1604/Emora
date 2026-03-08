const express = require('express');
const app = express();
require('dotenv').config();

app.use(express.json());

app.get('/', (req, res) => {
    res.send("Backend is Running!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});v