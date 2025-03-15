import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { QueryResult } from './models/QueryResult.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tabletalk')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Export data to MongoDB
app.post('/api/export', async (req, res) => {
  try {
    const { query, data, timestamp } = req.body;
    
    const queryResult = new QueryResult({
      query,
      data,
      timestamp
    });

    await queryResult.save();
    
    res.json({ message: 'Data exported successfully' });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});