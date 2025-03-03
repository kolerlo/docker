import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [savedMessages, setSavedMessages] = useState([]);
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [submitStatus, setSubmitStatus] = useState({ message: '', isError: false });

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/messages');
        const data = await response.json();
        setSavedMessages(data.messages);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setSubmitStatus({
          message: 'Failed to load history. Please check if server is running.',
          isError: true
        });
      }
    };
    
    fetchMessages();
  }, []);

  const fetchWeather = async () => {
    if (!city.trim()) {
      setSubmitStatus({ message: 'Please enter a city name', isError: true });
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:5000/api/weather?city=${encodeURIComponent(city)}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error fetching weather data');
      }
      
      const weatherData = await response.json();
      setWeather(weatherData);
      
      // Save the city and weather data to history
      await fetch('http://localhost:5000/api/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          city: city,
          weatherData: weatherData
        }),
      });
      
      setSubmitStatus({ message: 'Weather data retrieved and saved to history', isError: false });
      setTimeout(() => setSubmitStatus({ message: '', isError: false }), 3000);
      
      // Refresh history after adding new entry
      const msgResponse = await fetch('http://localhost:5000/api/messages');
      const msgData = await msgResponse.json();
      setSavedMessages(msgData.messages);
    } catch (error) {
      console.error('Weather fetch error:', error);
      setSubmitStatus({ 
        message: error.message || 'Error fetching weather data', 
        isError: true 
      });
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      fetchWeather();
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        
        {/* Status message display */}
        {submitStatus.message && (
          <div className={`status-message ${submitStatus.isError ? 'error' : 'success'}`}>
            {submitStatus.message}
          </div>
        )}
        
        <div className="weather-container">
          <h2>Weather Checker</h2>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Enter city name"
            className="text-input"
          />
          <button onClick={fetchWeather}>Get Weather</button>
          {weather && (
            <div className="weather-results">
              <h3>{weather.location.name}, {weather.location.country}</h3>
              <p>Temperature: {weather.current.temp_c}°C</p>
              <p>Condition: {weather.current.condition.text}</p>
              <img src={weather.current.condition.icon} alt="Weather Icon" />
            </div>
          )}
        </div>
        
        <div className="history-container">
          <h3>Search History:</h3>
          {savedMessages.length > 0 ? (
            [...savedMessages].reverse().map((msg, index) => (
              <p key={index} className="history-item">{msg}</p>
            ))
          ) : (
            <p className="white-text">No search history yet. Search for a city above!</p>
          )}
        </div>
      </header>
    </div>
  );
}

export default App;