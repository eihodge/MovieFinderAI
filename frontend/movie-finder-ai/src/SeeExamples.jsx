import React, { useState, useEffect } from 'react';
import './SeeExamples.css';

function SeeExamples({ onClose }) {
  const examples = [
    "Suggest films that showcase complex moral dilemmas.",
    "I want a film that feels like stepping into someone else’s day-to-day life.",
    "Halloween movies to watch at the beach",
    "I am an actor who loves performance on stage.",
    "I want to watch a movie set in the 80s or 90s with a nostalgic feel.",
    "I enjoy movies that are visually stunning and artistic, like Blade Runner 2049 or The Grand Budapest Hotel.",
    "I’m a violinist who loves classical music.",
    "Which animated film have the most unique art styles?",
    "I'm feeling down and want to watch a feel-good movie.",
    "List Academy Award-winning fantasy films.",
    "I'm in the mood for documentaries about real-world events.",
    "I want to watch movies that explore futuristic dystopias.",
    "I want to watch movies that showcase LGBTQ+ stories.",
    "I'm in the mood for silent films or black-and-white classics."

  ];

  const [displayText, setDisplayText] = useState("");
  const [index, setIndex] = useState(0);
  const [typing, setTyping] = useState(true); // Tracks typing/deleting state
  const [charIndex, setCharIndex] = useState(0); // Track position within text

  useEffect(() => {
    const currentText = examples[index];
    let interval;

    // Handle typing
    if (typing && charIndex < currentText.length) {
      interval = setInterval(() => {
        setDisplayText((prev) => prev + currentText[charIndex]);
        setCharIndex((prev) => prev + 1);
      }, 50); // Typing speed set to 0.3 seconds per letter
    }

    // Handle pause before deleting
    if (typing && charIndex === currentText.length) {
      clearInterval(interval);
      setTimeout(() => setTyping(false), 1200); // Pause 2 seconds after typing
    }

    // Handle deleting
    if (!typing && charIndex > 0) {
      interval = setInterval(() => {
        setDisplayText((prev) => prev.slice(0, -1));
        setCharIndex((prev) => prev - 1);
      }, 8); // Deleting speed set to 0.1 seconds per letter
    }

    // 0.5-second pause after deleting everything
    if (!typing && charIndex === 0) {
      clearInterval(interval);
      setTimeout(() => {
        setTyping(true);
        setIndex((prev) => (prev + 1) % examples.length);
      }, 300); // 0.5-second pause after deleting
    }

    return () => clearInterval(interval); // Cleanup
  }, [typing, charIndex, examples, index]);

  return (
    <div className="see-examples-container">
      <button className="close-button" onClick={onClose}>X</button>
      <h1>Example Prompts</h1>
      <div className="content">
        
        <p className="typewriter-text">{displayText}</p>
      </div>
    </div>
  );
}

export default SeeExamples;
