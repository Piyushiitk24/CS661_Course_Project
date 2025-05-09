import Slideshow from './Slideshow';
import './Home.css';
import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    document.title = "fakeNewsStory | Home";
  }, []);

  const teamMembers = [
    { name: "Aakriti", url: "https://www.linkedin.com/in/aakriti-sarkar-53b149260" },
    { name: "Ananya", url: "https://www.linkedin.com/in/ananya-chaturvedi-70b24a219/" },
    { name: "Arpita", url: "https://www.linkedin.com/in/arpita-santra" },
    { name: "Disha", url: "" },
    { name: "Khushi", url: "" },
    { name: "Piyush", url: "" },
    { name: "Ravi", url: "" },
    { name: "Sankhadeep", url: "https://www.linkedin.com/in/sankha14" }
  ];

  const modules = [
    { name: "Time of the Day", url: "/top-news" },
    { name: "Virality Analysis", url: "http://127.0.0.1:5001" },
    { name: "Top Trending Personalities", url: "http://127.0.0.1:5002" },
    { name: "Thematic Clustering", url: "http://localhost:5174/" },
    { name: "Trendy News Analysis", url: "http://127.0.0.1:5003" },
  ];

  return (
    <div className="home-root">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-text">
          <h1 className="hero-title">Fake News Story</h1>
          <p className="hero-subtitle">
            Discover how fake news spreads across platforms with interactive data visualizations.
          </p>
        </div>
        <div className="hero-slideshow">
          <Slideshow />
        </div>
      </section>

      {/* Modules Section */}
      <section className="modules-section">
        <h2 className="section-heading_M">Explore Modules</h2>
        <div className="module-grid">
          {modules.map(module => (
            <button
              key={module.name}
              className="module-card"
              onClick={() => {
                console.log("Opening URL:", module.url);
                window.open(module.url, '_blank')
              }}
            >
              {module.name}
            </button>
          ))}
        </div>
      </section>

      {/* Team Section */}
<section className="team-section">
  {/* ✅ Logos now outside the inner container */}
  <img src="/logo_iitk.png" alt="IIT Kanpur" className="team-logo left" />
  <img src="/logo_iitk.png" alt="IIT Kanpur" className="team-logo right" />

  <div className="team-content">
    <h2 className="section-heading_T">Meet the Dev Team</h2>
    <div className="team-grid">
      {teamMembers.map(member => (
        <button
          key={member.name}
          className="team-card"
          onClick={() => member.url && window.open(member.url, '_blank')}
        >
          {member.name}
        </button>
      ))}
    </div>
  </div>
</section>

</div>
  );
}
