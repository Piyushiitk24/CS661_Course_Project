import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './modules/Home';
import TopFakeNewsPlot from './modules/TopFakeNewsPlot';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/top-news" element={<TopFakeNewsPlot />} />
      </Routes>
    </Router>
  );
}

export default App;
