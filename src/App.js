
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Components/Login'; 
import Signup from './Components/Signup';
import Navbar from './Components/navbar';
import Home from './Components/home';
import Tasks from './Components/tasks';
import Pictures from './Components/pictures';
import Notifications from './Components/notifications';
import TripSettings from './Components/trip-setting';
import MoveTripSelector from './Components/move-trip-selector';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />

        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<Home />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/pictures" element={<Pictures />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/trip-settings" element={<TripSettings />} />
          <Route path="/move-trip-selector" element={<MoveTripSelector />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
