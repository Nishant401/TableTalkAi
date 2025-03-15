import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import QueryInput from './pages/QueryInput';
import ResultsDisplay from './pages/ResultsDisplay';
import Footer from './components/Footer';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/query" element={<QueryInput />} />
          <Route path="/results" element={<ResultsDisplay />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;