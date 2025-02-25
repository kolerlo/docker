import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
    const [inputText, setInputText] = useState('');
    const [savedMessages, setSavedMessages] = useState([]);
    const [city, setCity] = useState('');
    const [weather, setWeather] = useState(null);

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/messages');
                const data = await response.json();
                setSavedMessages(data.messages);
            } catch (error) {
                console.error('Error fetching messages:', error);
            }
        };
        fetchMessages();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await fetch('http://localhost:5000/api/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: inputText }),
            });
            setInputText('');
            const res = await fetch('http://localhost:5000/api/messages');
            const data = await res.json();
            setSavedMessages(data.messages);
        } catch (error) {
            console.error('Error saving message:', error);
        }
    };

    const fetchWeather = async () => {
        if (!city) return alert('Please enter a city');
        try {
            const response = await fetch(`http://localhost:5000/api/weather?city=${city}`);
            const data = await response.json();
            setWeather(data);
        } catch (error) {
            alert('Error fetching weather data');
        }
    };

    return (
        <div className="App">
            <header className="App-header">
                <h1>Fullstack App</h1>

                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Enter your message"
                        className="text-input"
                    />
                    <button type="submit">Save Message</button>
                </form>

                <div className="messages-container">
                    <h3>Saved Messages:</h3>
                    {savedMessages.map((msg, index) => (
                        <p key={index} className="white-text">{msg}</p>
                    ))}
                </div>

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
                        <div>
                            <h3>{weather.location.name}, {weather.location.country}</h3>
                            <p>Temperature: {weather.current.temp_c}°C</p>
                            <p>Condition: {weather.current.condition.text}</p>
                            <img src={weather.current.condition.icon} alt="Weather Icon" />
                        </div>
                    )}
                </div>
            </header>
        </div>
    );
}

export default App;
