import React, { useState } from 'react';
import './App.css';
import send from './assets/send.png'; 
import walmart from './assets/walmart.png'; 
import amazon from './assets/amazon.png'; 
import ebay from './assets/ebay.ico'; 
import sparkle from './assets/sparkle.png'; 

function App() {
  const [input, setInput] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false); // New loading state

  // Clean and split the recommendation into title and percentage
  const cleanRecommendation = (movie) => {
    const match = movie.match(/^(.*?)(\d+)%?$/); // Match movie title and percentage
    if (match) {
      const title = match[1].trim(); // Trim any excess spaces from the title
      const percentage = match[2].trim(); // Trim and capture the percentage number
      return { title, percentage };
    }
    return null; // Return null if it doesn't match
  };

  const handleSubmit = async () => {
    if (!input.trim()) {
      alert('Please provide a description.');
      return;
    }

    setLoading(true); // Set loading to true before the API call

    try {
      const response = await fetch('http://127.0.0.1:5000/generate-movies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input }),
      });

      const data = await response.json();

      if (!response.ok) {
        // If the response contains an error, alert the user
        if (data.error) {
          alert(data.error);
          return;
        } else {
          throw new Error('Failed to communicate with the backend');
        }
      }

      // Split by both commas and new lines
      const movies = data.message.split(/[\n,]+/);
      const cleanedMovies = movies.map(cleanRecommendation).filter(movie => movie); // Filter removes any null values
      setRecommendations(cleanedMovies);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to communicate with the backend');
    } finally {
      setLoading(false); // Reset loading to false after the API call
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault(); // Prevent default behavior (new line in textarea)
      handleSubmit(); // Call the submit function
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-div">
          <img src={sparkle} alt="Send" className="sparkle-icon" />
          <p className="app-title">MovieFinderAI</p>
        </div>
      </header>
      <p className="app-description">
        Enter a description of the person or a list of their interests, and we'll suggest potential movie ideas!
      </p>
      <textarea
        className="app-textarea"
        rows="10"
        cols="50"
        placeholder="Describe the person or their interests..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown} // Add the onKeyDown handler here
        autoFocus
      />
      <br />
      <div className="button-container-submit">
        <button className="app-button" onClick={handleSubmit}>
          <img src={send} alt="Send" className="send-icon" />
        </button>
      </div>

      <div className='loadingContainer'>
        {loading && <div className="loading"></div>} {/* Show loading indicator */}
      </div>
      

      <div className="recommendations-container">
        {recommendations.map((movie, index) => (
          <div key={index} className="recommendation">
            <span className="movie-title">{movie.title}</span>
            <span className="movie-percentage">{movie.percentage}% Match</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
