require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// Store only the last message
let lastMessage = "";

const API_KEY = process.env.WEATHER_API_KEY;
const BASE_URL = 'http://api.weatherapi.com/v1/current.json';

// Get the last message
app.get('/api/messages', async (req, res) => {
  try {
    res.json({ messages: lastMessage ? [lastMessage] : [] });
  } catch (error) {
    console.error('Error fetching message:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Added GET handler for /api/message endpoint
app.get('/api/message', (req, res) => {
  res.json({ message: "This endpoint only accepts POST requests with message data" });
});

// Save a new message (replacing any previous one)
app.post('/api/message', async (req, res) => {
  try {
    console.log('Request body:', req.body); // Log the request body
    const { city, weatherData } = req.body;
    if (city && weatherData) {
      // Format the weather information
      const formattedMessage = `City: ${city} | Temp: ${weatherData.current.temp_c}°C | Condition: ${weatherData.current.condition.text}`;
      // Replace the old message instead of pushing to an array
      lastMessage = formattedMessage;
      res.json({ success: true, message: 'Weather data saved' });
    } else {
      console.log('Missing city or weatherData in request body');
      res.status(400).json({ success: false, message: 'City and weatherData are required' });
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