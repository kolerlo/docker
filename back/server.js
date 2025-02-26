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
    // Return the full formatted messages for the history display
    res.json({ messages: messages.map(msg => msg.fullData) });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get the last city name
app.get('/api/message', (req, res) => {
  if (messages.length > 0) {
    // Return just the city name
    res.json({ message: messages[messages.length - 1].cityName });
  } else {
    res.json({ message: "No messages saved yet" });
  }
});

// Save a new message
app.post('/api/message', async (req, res) => {
  try {
    console.log('Request body:', req.body); // Log the request body
    const { city, weatherData } = req.body;
    if (city && weatherData) {
      // Store just the original city name and the full formatted data
      messages.push({
        cityName: city,
        fullData: `City: ${city} | Temp: ${weatherData.current.temp_c}°C | Condition: ${weatherData.current.condition.text}`
      });
      res.json({ success: true, message: 'Weather data saved to history' });
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