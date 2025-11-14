const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const errorHandlerMiddleware = require('./middlewares/errorHandlerMiddleware');
const iecController = require('./controllers/iec.controller');

const PORT = process.env.PORT ;
const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/iec', iecController);

// Health check route
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Test database connection
app.get('/api/test-db', async (req, res) => {
    try {
        const pool = require('./configs/db.config');
        const [rows] = await pool.query('SELECT 1 as test');
        res.status(200).json({
            success: true,
            message: 'Database connection successful',
            data: rows
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Database connection failed',
            error: error.message
        });
    }
});

// 404 handler - Express 5 compatible
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handler middleware 
app.use(errorHandlerMiddleware);


app.listen(PORT, '0.0.0.0', () => {
    console.log(`App is listening at port : ${PORT}`);
})


