// src/App.js (updated)
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext'; // Add useAuth here
import Login from './components/Auth/Login';
import Callback from './components/Callback';
import Home from './components/Home';
import SearchPage from './pages/SearchPage';
import AuthContainer from './components/Auth/AuthContainer';
import './App.css';

// Navigation component
const Navigation = () => {
  const { authenticated, logout, user } = useAuth();
  
  if (!authenticated) return null;
  
  return (
    <nav className="main-nav">
      <div className="nav-container">
        <div className="nav-logo">Spotify Explorer</div>
        <ul className="nav-links">
          <li><a href="/dashboard">Home</a></li>
          <li><a href="/search">Search</a></li>
          {user && (
            <li className="user-profile">
              <span className="user-name">{user.display_name}</span>
              {user.images && user.images.length > 0 && (
                <img
                  src={user.images[0].url}
                  alt={user.display_name}
                  className="user-image"
                />
              )}
            </li>
          )}
          <li><button onClick={logout} className="nav-logout">Logout</button></li>
        </ul>
      </div>
    </nav>
  );
};

// App routes
const AppRoutes = () => {
  return (
    <>
      <Navigation />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/callback" element={<Callback />} />
        <Route 
          path="/dashboard" 
          element={
            <AuthContainer>
              <Home />
            </AuthContainer>
          } 
        />
        <Route 
          path="/search" 
          element={
            <AuthContainer>
              <SearchPage />
            </AuthContainer>
          } 
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <AppRoutes />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
