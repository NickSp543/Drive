const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database'); 

const fileRoutes = require('./routes/fileRoutes');
const searchRoutes = require('./routes/searchRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Connect to MongoDB
connectDB();

// Enable CORS
app.use(cors());

// Limit increased to 50mb to handle large files
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/files', fileRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
    res.status(200).send('API is running and listening...');
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Trying port ${PORT + 1}...`);
        app.listen(PORT + 1, () => {
            console.log(`Server running on port ${PORT + 1}`);
        });
    } else {
        console.error('Server error:', err);
    }
});