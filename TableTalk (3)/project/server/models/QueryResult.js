import mongoose from 'mongoose';

const queryResultSchema = new mongoose.Schema({
  query: {
    type: String,
    required: true
  },
  data: {
    type: Array,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

export const QueryResult = mongoose.model('QueryResult', queryResultSchema);