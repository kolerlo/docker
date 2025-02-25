require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

let messages = [];

const API_KEY = process.env.WEATHER_API_KEY;
const BASE_URL = 'http://api.weatherapi.com/v1/current.json';

// Get all messages
app.get('/api/messages', async (req, res) => {
  try {
    res.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Added GET handler for /api/message endpoint
app.get('/api/message', (req, res) => {
  res.json({ message: "This endpoint only accepts POST requests with a message in the body" });
});

// Save a new message
app.post('/api/message', async (req, res) => {
  try {
    console.log('Request body:', req.body); // Log the request body
    const { message } = req.body;
    if (message) {
      messages.push(message);
      res.json({ success: true, message: 'Message saved successfully' });
    } else {
      console.log('Missing message in request body');
      res.status(400).json({ success: false, message: 'Message is required' });
    }
  } catch (error) {
    console.error('Error in /api/message endpoint:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Fetch weather data
app.get('/api/weather', async (req, res) => {
  try {
    const { city } = req.query;
    if (!city) return res.status(400).json({ error: 'City is required' });
    
    const response = await axios.get(`${BASE_URL}?key=${API_KEY}&q=${city}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching weather:', error.response?.data || error.message);
    res.status(500).json({ error: 'Error fetching weather data' });
  }
});

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});