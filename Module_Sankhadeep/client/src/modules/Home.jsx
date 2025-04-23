import './Home.css';
import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    document.title = "fakeNewsStory | Home";
  }, []);

  // Click handler for team member cards
  function handleCardClick(e) {
    const url = e.currentTarget.getAttribute('data-url');
    if (url) window.open(url, '_blank');
  }

  // ✅ Team members array
  const teamMembers = [
    { name: "Akriti", url: "" },
    { name: "Ananya", url: "" },
    { name: "Arpita", url: "" },
    { name: "Disha", url: "" },
    { name: "Piyush", url: "" },
    { name: "Ravi", url: "" },
    { name: "Sankhadeep", url: "https://www.linkedin.com/in/sankha14" }
  ];

  return (
    <main className="home-root">
      <section className="home-container">
        <header className="home-hero">
          <h1>Fake News Story</h1>
          <p>Discover how fake news spreads across platforms with interactive data visualizations.</p>
        </header>

        <section className="home-navigation">
          <h2>Explore Modules</h2>
          <div className="button-row">
            <button className="nav-button" onClick={() => window.open('/top-news', '_blank')}>Top Fake News</button>
            <button className="nav-button" onClick={() => window.open('/cluster', '_blank')}>Clustering</button>
            <button className="nav-button" onClick={() => window.open('/network', '_blank')}>Spread Network</button>
            <button className="nav-button" onClick={() => window.open('/sentiment', '_blank')}>Sentiment Flow</button>
          </div>
          <div className="button-row">
            <button className="nav-button" onClick={() => window.open('/timeline', '_blank')}>Source Timeline</button>
            <button className="nav-button" onClick={() => window.open('/geo', '_blank')}>Geo Spread</button>
            <button className="nav-button" onClick={() => window.open('/engagement', '_blank')}>Engagement Graph</button>
          </div>
        </section>

        <section className="home-team">
          <h2>Meet the Team</h2>

          {/* 1st row: 5 members */}
          <div className="team-row">
            {teamMembers.slice(0, 5).map(member => (
              <button
                key={member.name}
                className="card"
                data-url={member.url}
                onClick={handleCardClick}
              >
                {member.name}
              </button>
            ))}
          </div>

          {/* 2nd row: 2 members */}
          <div className="team-row">
            {teamMembers.slice(5).map(member => (
              <button
                key={member.name}
                className="card"
                data-url={member.url}
                onClick={handleCardClick}
              >
                {member.name}
              </button>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
