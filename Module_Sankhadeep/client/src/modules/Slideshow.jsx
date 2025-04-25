import React, { useState, useEffect } from 'react';
import './Slideshow.css';

const images = [
  '/slideshow/1_fake.png',
  '/slideshow/2_fake.png',
  '/slideshow/3_fake.png',
  '/slideshow/4_fake.png',
  '/slideshow/5_fake.png',
  '/slideshow/6_fake.png',
  '/slideshow/7_fake.png',
  '/slideshow/8_fake.png'
];

export default function Slideshow() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-advance
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const goToIndex = (index) => {
    setCurrentIndex(index);
  };

  return (
    <div className="slideshow-container">
      <div className="slide-wrapper" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
        {images.map((src, index) => (
          <img key={index} src={src} className="slide-image" alt={`Slide ${index + 1}`} />
        ))}
      </div>
      <div className="slideshow-dots">
        {images.map((_, index) => (
          <span
            key={index}
            className={`dot ${index === currentIndex ? 'active' : ''}`}
            onClick={() => goToIndex(index)}
          ></span>
        ))}
      </div>
    </div>
  );
}
