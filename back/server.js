require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

// Prometheus metrics
const promClient = require('prom-client');
const collectDefaultMetrics = promClient.collectDefaultMetrics;
const Registry = promClient.Registry;
const register = new Registry();
collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [1, 5, 15, 50, 100, 200, 500, 1000, 2000, 5000],
  registers: [register],
});

// Updated counter with both 'city' (user input) and 'api_city' (API response) labels
const weatherRequestCounter = new promClient.Counter({
  name: 'weather_request_total',
  help: 'Counter for weather API requests',
  labelNames: ['city', 'api_city'],
  registers: [register],
});

// Create Express app
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// Request timing middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    httpRequestDurationMicroseconds.labels(
      req.method,
      req.route?.path || req.path,
      res.statusCode
    ).observe(duration);
  });
  
  next();
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

let messages = [];
const API_KEY = process.env.WEATHER_API_KEY;
const BASE_URL = 'http://api.weatherapi.com/v1/current.json';

// Get all messages
app.get('/api/messages', async (req, res) => {
  try {
    res.json({ messages: messages.map(msg => msg.fullData) });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get the last city name
app.get('/api/message', (req, res) => {
  if (messages.length > 0) {
    res.json({ message: messages[messages.length - 1].cityName });
  } else {
    res.json({ message: "No messages saved yet" });
  }
});

// Save a new message
app.post('/api/message', async (req, res) => {
  try {
    console.log('Request body:', req.body);
    const { city, weatherData } = req.body;
    if (city && weatherData) {
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

// Helper function to fetch weather data from provider
async function fetchWeatherFromProvider(city) {
  const response = await axios.get(`${BASE_URL}?key=${API_KEY}&q=${city}`);
  return response.data;
}

// Updated weather endpoint with the new metrics logic
app.get('/api/weather', async (req, res) => {
  try {
    const userInputCity = req.query.city;
    if (!userInputCity) return res.status(400).json({ error: 'City is required' });
    
    const weatherData = await fetchWeatherFromProvider(userInputCity);
    
    // Extract the API's city name from the response
    const apiCityName = weatherData.location.name;
    
    // Increment both counters - one with user input city and one with API city name
    weatherRequestCounter.labels(userInputCity, apiCityName).inc();
    
    res.json(weatherData);
  } catch (error) {
    console.error('Error fetching weather:', error.response?.data || error.message);
    res.status(500).json({ error: 'Error fetching weather data' });
  }
});

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});