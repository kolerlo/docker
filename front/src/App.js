import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [savedMessages, setSavedMessages] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [submitStatus, setSubmitStatus] = useState({ message: '', isError: false });
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/messages');
        const data = await response.json();
        setSavedMessages(data.messages);
        
        // Extract unique city names from the history for the dropdown
        if (data.messages && data.messages.length > 0) {
          const cityNames = data.messages.map(msg => {
            const cityMatch = msg.match(/City: ([^|]+)/);
            return cityMatch ? cityMatch[1].trim() : null;
          }).filter(Boolean);
          
          // Get unique city names (last 4)
          const uniqueCities = [...new Set(cityNames)].slice(0, 4);
          setRecentSearches(uniqueCities);
        }
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
      
      // Save the city and weather data to history - use API city name
      await fetch('http://localhost:5000/api/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          city: weatherData.location.name, // Use the properly formatted city name from API
          weatherData: weatherData
        }),
      });
      
      setSubmitStatus({ message: 'Weather data retrieved and saved to history', isError: false });
      setTimeout(() => setSubmitStatus({ message: '', isError: false }), 3000);
      
      // Refresh history after adding new entry
      const msgResponse = await fetch('http://localhost:5000/api/messages');
      const msgData = await msgResponse.json();
      setSavedMessages(msgData.messages);
      
      // Update recent searches
      const cityNames = msgData.messages.map(msg => {
        const cityMatch = msg.match(/City: ([^|]+)/);
        return cityMatch ? cityMatch[1].trim() : null;
      }).filter(Boolean);
      
      // Get unique city names (last 4)
      const uniqueCities = [...new Set(cityNames)].slice(0, 4);
      setRecentSearches(uniqueCities);
      
      // Hide dropdown after search
      setShowDropdown(false);
    } catch (error) {
      console.error('Weather fetch error:', error);
      setSubmitStatus({ 
        message: error.message || 'Error fetching weather data', 
        isError: true 
      });
    }
  };

  // Handle Enter key press
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      fetchWeather();
    }
  };

  // Select city from dropdown
  const selectCity = (selectedCity) => {
    setCity(selectedCity);
    setShowDropdown(false);
    // Auto-search when selecting from dropdown
    setTimeout(() => {
      fetchWeather();
    }, 100);
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
          <div className="search-wrapper">
            <div className="search-container">
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                placeholder="Enter city name"
                className="text-input"
              />
              
              {/* Recent searches dropdown */}
              {showDropdown && recentSearches.length > 0 && (
                <div className="recent-searches">
                  {recentSearches.map((recentCity, index) => (
                    <div 
                      key={index} 
                      className="recent-city"
                      onClick={() => selectCity(recentCity)}
                    >
                      {recentCity}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button onClick={fetchWeather}>Get Weather</button>
          </div>
          
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