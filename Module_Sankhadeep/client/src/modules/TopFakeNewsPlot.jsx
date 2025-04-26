import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import './TopFakeNewsPlot.css';

export default function TopFakeNewsPlot() {
  const [source, setSource] = useState('all');
  const [type, setType] = useState('fake');
  const [topN, setTopN] = useState(10);
  const [connectPoints, setConnectPoints] = useState(false);
  const [scatterData, setScatterData] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);

  useEffect(() => {
    fetch('/combined_data_processed.csv')
      .then(res => res.text())
      .then(csvText => {
        const rows = csvText.split('\n').slice(1);
        const parsed = rows
          .map(r => r.split(','))
          .filter(r => r.length >= 11)
          .map(r => ({
            title: r[2],
            tweet_ids: r[3],
            source: r[4],
            type: r[5],
            date: new Date(r[6]),
            domain: r[7],
            sentiment: parseFloat(r[10]) || 0
          }));

        const filtered = parsed.filter(row => {
          const sourceMatch = source === 'all' || row.source === source;
          const typeMatch = type === 'all' || row.type === type;
          return sourceMatch && typeMatch;
        });

        const withTweetCount = filtered.map(row => ({
          ...row,
          tweet_count: row.tweet_ids.split('\t').length
        }));

        const sorted = withTweetCount
          .sort((a, b) => b.tweet_count - a.tweet_count)
          .slice(0, topN);

        // Prepare scatter plot data
        const shortTitles = sorted.map(d => d.title.split(' ').slice(0, 4).join(' '));
        const fullTitles = sorted.map(d => d.title);
        const times = sorted.map(d =>
          d.date.getHours() + d.date.getMinutes() / 60 + d.date.getSeconds() / 3600
        );
        const sentiments = sorted.map(d => d.sentiment);
        const tweetCounts = sorted.map(d => d.tweet_ids.split('\t').length);
        const formattedTimes = sorted.map(d => {
          const h = d.date.getHours().toString().padStart(2, '0');
          const m = d.date.getMinutes().toString().padStart(2, '0');
          const s = d.date.getSeconds().toString().padStart(2, '0');
          return `${h}:${m}:${s}`;
        });

        setScatterData([{
          x: shortTitles,
          y: times,
          customdata: formattedTimes.map((time, idx) => [time, tweetCounts[idx], sorted[idx].domain]),
          text: fullTitles,
          type: 'scatter',
          mode: connectPoints ? 'lines+markers' : 'markers',
          marker: {
            size: 12,
            color: sentiments,
            colorscale: 'Viridis',
            showscale: true,
            colorbar: {
              title: {
                text: 'Sentiment Score',
                side: 'right'
              }
            }
            
          },
          hovertemplate:
  '<b>%{text}</b><br>' +
  'Time of Day: %{customdata[0]}<br>' +
  'Tweet Count: %{customdata[1]}<br>' +
  'Domain: %{customdata[2]}<extra></extra>'
        }]);

        // Prepare heatmap data
        const hours = Array(24).fill(0);
for (const d of sorted) {
  const hour = d.date.getHours();
  const tweetCount = d.tweet_ids.split('\t').length; // get actual tweet count
  hours[hour] += tweetCount; // add tweet count instead of +1
}


        setHeatmapData([{
          z: [hours],
          x: Array.from({ length: 24 }, (_, i) => i),
          y: [''],
          type: 'heatmap',
          colorscale: 'Viridis', /* or, YlGnBu or, Plasma */
          showscale: true,
          colorbar: {
            title: {
              text: 'Tweet Count',
              side: 'right'
            }
          },
          hovertemplate: 'Hour of the Day: %{x}th<br>Tweet Count: %{z}<extra></extra>'
        }]);
        
      });
  }, [source, type, topN, connectPoints]);

  useEffect(() => {
    document.title = 'fakeNewsStory | Time-of-the-Day';
  }, []);

  return (
    <div className="top-news-root">
      <h2>Top Fake News: Time of the Day</h2>

      <div className="control-panel">
        <label>
          <span>Source:</span>
          <select value={source} onChange={e => setSource(e.target.value)}>
            <option value="politifact">Politifact</option>
            <option value="gossipcop">Gossipcop</option>
            <option value="all">All</option>
          </select>
        </label>

        <label>
          <span>Type:</span>
          <select value={type} onChange={e => setType(e.target.value)}>
            <option value="fake">Fake</option>
            <option value="real">Real</option>
            <option value="all">All</option>
          </select>
        </label>

        <div className="slider-group">
          <span className="slider-label">Top N:</span>
          <div className="slider-row">
            <input
              type="range"
              min="1"
              max="100"
              value={topN}
              onChange={e => setTopN(Number(e.target.value))}
            />
            <span className="slider-value">{topN}</span>
          </div>
        </div>

      </div>

      {/* Scatter Plot */}
      <Plot
        data={scatterData}
        layout={{
          title: {
            text: '<span style="font-weight: normal; font-size: 14px;">(Decreasing retweet frequency from left to right on the <b>News</b> axis)</span>',
            x: 0.5,
            xanchor: 'center',
            yanchor: 'top'
          },
          xaxis: {
            title: {
              text: 'News',
              font: { size: 16, family: 'Arial Black' },
              standoff: 50
            }
          },
          yaxis: {
            title: {
              text: 'Time of the Day',
              font: { size: 16, family: 'Arial Black' },
              standoff: 20
            },
            range: [0, 24],
            tickvals: [0, 3, 6, 9, 12, 15, 18, 21, 23],
            ticktext: ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00', '23:00']
          },
          margin: { t: 80, b: 150 },
          hovermode: 'closest',
          responsive: true,
          transition: {
            duration: 500,
            easing: 'cubic-in-out'
          }
        }}
        config={{ displayModeBar: false }}
        style={{ width: '100%', height: '600px' }}
      />

      {/* Heatmap Plot */}
      <h3 style={{ marginTop: '3rem', marginBottom: '1rem', textAlign: 'center', color: '#22f3e3' }}>
        Tweet Distribution by Hour
      </h3>
      <Plot
        data={heatmapData}
        layout={{
          title: '',
  xaxis: {
    title: {
      text: 'Hour of the Day',
      font: { size: 16, family: 'Arial Black' }
    },
    tickmode: 'linear',
    tick0: 0,
    dtick: 1
  },
  yaxis: {
    title: {
      text: '',
      font: { size: 16, family: 'Arial Black' }
    }
  },
          margin: { t: 30 },
          hovermode: 'closest',
          responsive: true
        }}
        config={{ displayModeBar: false }}
        style={{ width: '100%', height: '300px' }}
      />
    </div>
  );
}
