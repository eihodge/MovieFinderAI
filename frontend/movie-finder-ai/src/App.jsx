import React, { useState } from 'react';
import './App.css';
import './SeeExamples.css';
import './Loading.css';
import './Sort.css';
import './Recommendations.css';
import send from './assets/send.png'; 
import sparkle from './assets/sparkle.png'; 
import SeeExamples from './SeeExamples';

function App() {
  const [input, setInput] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [movieData, setMovieData] = useState({});
  const [activeSort, setActiveSort] = useState(''); // Track the active sort button
  const [showExamples, setShowExamples] = useState(false); // Initialize state here

  const genreMapping = { 28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime", 99: "Documentary", 
                         18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music", 
                         9648: "Mystery", 10749: "Romance", 878: "Science Fiction", 10770: "TV Movie", 53: "Thriller", 
                         10752: "War", 37: "Western" };

  const sortRecommendations = (type) => {
    let sortedRecommendations = [...recommendations];

    switch (type) {
      case 'alphabetical':
        sortedRecommendations.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'year':
        sortedRecommendations.sort((a, b) => {
          const yearA = movieData[a.title]?.details?.release_date?.substring(0, 4) || '0';
          const yearB = movieData[b.title]?.details?.release_date?.substring(0, 4) || '0';
          return yearB.localeCompare(yearA); // Sort by year, descending
        });
        break;
      case 'rating':
        sortedRecommendations.sort((a, b) => {
          const ratingA = parseFloat(movieData[a.title]?.details?.rating || 0);
          const ratingB = parseFloat(movieData[b.title]?.details?.rating || 0);
          return ratingB - ratingA; // Sort by rating, descending
        });
        break;
      case 'popularity':
        sortedRecommendations.sort((a, b) => {
          const popularityA = parseFloat(movieData[a.title]?.details?.popularity || 0);
          const popularityB = parseFloat(movieData[b.title]?.details?.popularity || 0);
          return popularityB - popularityA; // Sort by popularity, descending
        });
        break;
      case 'match':
        sortedRecommendations.sort((a, b) => parseInt(b.percentage) - parseInt(a.percentage)); // Sort by % Match, descending
        break;
      default:
        break;
    }

    setRecommendations(sortedRecommendations);
  };

  const cleanRecommendation = (movie) => {
    const match = movie.match(/^(.*?)(\d+)%?$/);
    if (match) {
      const title = match[1].trim();
      const percentage = match[2].trim();
      return { title, percentage };
    }
    return null;
  };

  const handleSubmit = async () => {
    if (!input.trim()) {
      alert('Please provide a description.');
      return;
    }
  
    // Clear previous recommendations immediately
    setRecommendations([]);
    setMovieData({});  // Clear movie data to avoid rendering old data
    setActiveSort(''); // Reset the active sort button when submitting a new search
    setLoading(true);
  
    try {
      const response = await fetch('https://moviefinderai-0df4e32f9921.herokuapp.com/generate-movies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        if (data.error) {
          alert(data.error);
          return;
        } else {
          throw new Error('Failed to communicate with the backend');
        }
      }
  
      const movies = data.message.split(/[\n,]+/);
      const cleanedMovies = movies.map(cleanRecommendation).filter(movie => movie);
  
      const movieDataMap = {};
      const validRecommendations = [];
  
      await Promise.all(cleanedMovies.map(async (movie) => {
        const movieDetails = await fetchMovieDetails(movie.title);
  
        // Only add the movie if it has valid details
        if (movieDetails) {
          movieDataMap[movie.title] = { 
            posterUrl: movieDetails.poster_url, 
            details: movieDetails 
          };
          validRecommendations.push(movie); // Add only valid recommendations
        }
      }));
  
      setRecommendations(validRecommendations); // Update with valid movies only
      setMovieData(movieDataMap); // Update the state with movie data
  
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to communicate with the backend');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchMoviePoster = async (movieTitle) => {
    try {
      const response = await fetch('https://moviefinderai-0df4e32f9921.herokuapp.com/get-movie-poster', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ movie: movieTitle })
      });
  
      const data = await response.json();
  
      if (!response.ok || data.error) {
        console.error('Error fetching movie poster:', data.error || 'Unknown error');
        return null;
      }
  
      return data.poster_url; // This is the poster URL
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  };

  const fetchMovieDetails = async (movieTitle) => {
    try {
      const response = await fetch('https://moviefinderai-0df4e32f9921.herokuapp.com/get-movie-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ movie: movieTitle })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error('Failed to fetch movie details');
      }

      return data; // Return the movie details
    } catch (error) {
      console.error('Error fetching movie details:', error);
      return null;
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSubmit();
    }
  };






  const handleSeeExamples = () => {
    setShowExamples(true);
  };

  const handleCloseExamples = () => {
    setShowExamples(false);
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
          Describe your movie preferences, and we’ll suggest films tailored to your tastes! 
          <button className="see-examples-button" onClick={handleSeeExamples}>See examples</button>
          
          {/* Conditional rendering for the SeeExamples overlay */}
          {showExamples && (
            <div className="overlay">
              <div className="modal">
                <SeeExamples onClose={handleCloseExamples} />
              </div>
            </div>
          )}

        </p>

      <textarea
        className="app-textarea"
        rows="10"
        cols="50"
        placeholder="Describe your interests or preferences..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
      />
      <br />
      <div className="button-container-submit">
        <button className="app-button" onClick={handleSubmit}>
          <img src={send} alt="Send" className="send-icon" />
        </button>
      </div>

      <div className='loadingContainer'>
        {loading && <div className="loading"></div>}
      </div>

      {recommendations.length > 0 && (
        <div className="sort-container">
          <p className="sort-title">Sort by:</p>
          <div className="sort-buttons">
            <button 
              className={`sort-button ${activeSort === 'alphabetical' ? 'active' : ''}`} 
              onClick={() => {
                sortRecommendations('alphabetical');
                setActiveSort('alphabetical'); // Set active sort
              }}
            >
              Title
            </button>
            <button 
              className={`sort-button ${activeSort === 'year' ? 'active' : ''}`} 
              onClick={() => {
                sortRecommendations('year');
                setActiveSort('year'); // Set active sort
              }}
            >
              Year
            </button>
            <button 
              className={`sort-button ${activeSort === 'rating' ? 'active' : ''}`} 
              onClick={() => {
                sortRecommendations('rating');
                setActiveSort('rating'); // Set active sort
              }}
            >
              Rating
            </button>
            <button 
              className={`sort-button ${activeSort === 'match' ? 'active' : ''}`} 
              onClick={() => {
                sortRecommendations('match');
                setActiveSort('match'); // Set active sort
              }}
            >
              Match
            </button>
          </div>
        </div>
      )}

      <div className="recommendations-container">
        {recommendations.map((movie, index) => (
          <div key={index} className="recommendation">
            <div className="poster-container">
              {movieData[movie.title]?.posterUrl && (
                <img 
                  src={movieData[movie.title].posterUrl} 
                  alt={`${movie.title} poster`} 
                  className="movie-poster" 
                  style={{ borderColor: parseInt(movie.percentage) >= 90 ? 'gold' : 'gray' }}
                />
              )}
            </div>
            <div className="info-container">
              <div className="title-percentage">
                <span className="movie-title">{movie.title} </span>
                {/* Safe check before accessing release_date */}
                <p className='movie-year'><strong></strong> 
                  {movieData[movie.title]?.details?.release_date?.substring(0, 4) || 'N/A'}
                </p>

                <span 
                  className="movie-percentage" 
                  style={{ color: parseInt(movie.percentage) >= 90 ? 'gold' : 'inherit' }}
                >
                  {movie.percentage}% Match
                </span>
              </div>

              {/* Safe check before displaying movie details */}
              {movieData[movie.title]?.details && (
                <div className="movie-info">
                  <p><strong></strong> {movieData[movie.title].details.description || 'No description available'}</p>
                  <p>★ <strong>{parseFloat(movieData[movie.title].details.rating || 0).toFixed(1)}</strong> / 10</p>
                  <p><strong>Genre: </strong> 
                    {movieData[movie.title].details.genre_ids.map(id => genreMapping[id]).join(', ') || 'No genres available'}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;