
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import About from './pages/About';
import Chat from './pages/Chat';
import NotFound from './pages/NotFound';
import Impressum from './pages/Impressum';
import Privacy from './pages/Privacy';
import CSAEPolicies from './pages/CSAEPolicies';
import { EventProvider } from './contexts/EventContext';
import { ThemeProvider } from './contexts/ThemeContext';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <EventProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/about" element={<About />} />
            <Route path="/impressum" element={<Impressum />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/CSAEPolicies" element={<CSAEPolicies />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </EventProvider>
    </ThemeProvider>
  );
}

export default App;
