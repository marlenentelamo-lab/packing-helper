
import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import api from './api';
import Login from './Components/Login'; 
import Signup from './Components/Signup';
import Navbar from './Components/navbar';
import Home from './Components/home';
import Tasks from './Components/tasks';
import Pictures from './Components/pictures';
import Notifications from './Components/notifications';
import MoveTripSelector from './Components/move-trip-selector';
import AllTasks from './Components/AllTasks';
import './App.css';

function ProtectedRoute({ user, authReady, children }) {
  if (!authReady) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PublicRoute({ user, authReady, children }) {
  if (!authReady) {
    return <div>Loading...</div>;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadCurrentUser() {
      try {
        const response = await api.get('/me');
        if (isMounted) {
          setUser(response?.user || null);
        }
      } catch (error) {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setAuthReady(true);
        }
      }
    }

    loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="App">
        <Navbar user={user} setUser={setUser} />

        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute user={user} authReady={authReady}>
                <Login onAuthSuccess={setUser} />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute user={user} authReady={authReady}>
                <Signup />
              </PublicRoute>
            }
          />
          <Route path="/" element={<ProtectedRoute user={user} authReady={authReady}><Home /></ProtectedRoute>} />
          <Route path="/tasks" element={<ProtectedRoute user={user} authReady={authReady}><Tasks /></ProtectedRoute>} />
          <Route path="/pictures" element={<ProtectedRoute user={user} authReady={authReady}><Pictures /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute user={user} authReady={authReady}><Notifications /></ProtectedRoute>} />
          <Route path="/move-trip-selector" element={<ProtectedRoute user={user} authReady={authReady}><MoveTripSelector /></ProtectedRoute>} />
          <Route path="/all-tasks" element={<ProtectedRoute user={user} authReady={authReady}><AllTasks /></ProtectedRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
