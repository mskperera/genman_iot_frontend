import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import MapView from './MapView';
import TableView from './TableView';
import GeneratorDetails from './GeneratorDetails';

// Example logo URL (replace with your own)
const brandLogo = 'https://via.placeholder.com/40x40.png?text=Logo';

const NavigationBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [viewMode, setViewMode] = useState(location.pathname === '/table' ? 'table' : 'map');
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Simulate login state
  const [isProfileOpen, setIsProfileOpen] = useState(false); // Dropdown state

  // Sync viewMode with URL changes
  useEffect(() => {
    setViewMode(location.pathname === '/table' ? 'table' : 'map');
  }, [location.pathname]);

  const handleToggle = () => {
    if (viewMode === 'map') {
      setViewMode('table');
      navigate('/table');
    } else {
      setViewMode('map');
      navigate('/');
    }
  };

  const handleLoginLogout = () => {
    setIsLoggedIn(!isLoggedIn);
    // Add actual login/logout logic here (e.g., API call)
  };

  const toggleProfileDropdown = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  return (
    <div
      style={{
        height: '60px',
        backgroundColor: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 20px',
        borderBottom: '1px solid #ddd',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* Brand Logo */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img
          src={brandLogo}
          alt="Brand Logo"
          style={{ width: '40px', height: '40px', marginRight: '10px' }}
        />
        <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#333' }}>GenTrack</span>
      </div>

      {/* Center Toggle Button */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={handleToggle}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#fff',
            backgroundColor: viewMode === 'map' ? '#4caf50' : '#2196f3', // Green for map, Blue for table
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease, transform 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
          onMouseOver={(e) =>
            (e.target.style.backgroundColor = viewMode === 'map' ? '#388e3c' : '#1976d2')
          }
          onMouseOut={(e) =>
            (e.target.style.backgroundColor = viewMode === 'map' ? '#4caf50' : '#2196f3')
          }
          onMouseDown={(e) => (e.target.style.transform = 'scale(0.95)')}
          onMouseUp={(e) => (e.target.style.transform = 'scale(1)')}
        >
          <span style={{ fontSize: '16px' }}>
            {viewMode === 'map' ? '🗺️' : '📋'}
          </span>
          {viewMode === 'map' ? 'Switch to Table View' : 'Switch to Map View'}
        </button>
      </div>

      {/* Right Side Menus */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        {/* About Link */}
        <button
          onClick={() => navigate('/about')} // Placeholder route
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            color: '#333',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'color 0.3s',
          }}
          onMouseOver={(e) => (e.target.style.color = '#3388ff')}
          onMouseOut={(e) => (e.target.style.color = '#333')}
        >
          About
        </button>

        {/* Login/Logout Button */}
        <button
          onClick={handleLoginLogout}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#fff',
            backgroundColor: isLoggedIn ? '#f44336' : '#3388ff', // Red for logout, Blue for login
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease',
          }}
          onMouseOver={(e) =>
            (e.target.style.backgroundColor = isLoggedIn ? '#d32f2f' : '#2566cc')
          }
          onMouseOut={(e) =>
            (e.target.style.backgroundColor = isLoggedIn ? '#f44336' : '#3388ff')
          }
        >
          {isLoggedIn ? 'Logout' : 'Login'}
        </button>

        {/* User Profile Picture with Dropdown */}
        {isLoggedIn && (
          <div style={{ position: 'relative' }}>
            <img
              src="https://via.placeholder.com/32x32.png?text=U" // Placeholder user image
              alt="User Profile"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                cursor: 'pointer',
                border: '2px solid #3388ff',
              }}
              onClick={toggleProfileDropdown}
            />
            {isProfileOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '40px',
                  right: '0',
                  backgroundColor: '#fff',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                  width: '150px',
                  zIndex: 1000,
                }}
              >
                <button
                  onClick={() => {
                    navigate('/profile'); // Placeholder route
                    setIsProfileOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    textAlign: 'left',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s',
                  }}
                  onMouseOver={(e) => (e.target.style.backgroundColor = '#f0f0f0')}
                  onMouseOut={(e) => (e.target.style.backgroundColor = 'transparent')}
                >
                  Profile
                </button>
                <button
                  onClick={() => {
                    navigate('/settings'); // Placeholder route
                    setIsProfileOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    textAlign: 'left',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s',
                  }}
                  onMouseOver={(e) => (e.target.style.backgroundColor = '#f0f0f0')}
                  onMouseOut={(e) => (e.target.style.backgroundColor = 'transparent')}
                >
                  Settings
                </button>
                <button
                  onClick={() => {
                    setIsLoggedIn(false);
                    setIsProfileOpen(false);
                    // Add logout logic here
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    textAlign: 'left',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s',
                  }}
                  onMouseOver={(e) => (e.target.style.backgroundColor = '#f0f0f0')}
                  onMouseOut={(e) => (e.target.style.backgroundColor = 'transparent')}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const GeneratorMap = () => {
  return (
    <Router>
      <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column' }}>
        <NavigationBar />
        <Routes>
          <Route path="/" element={<MapView />} />
          <Route path="/table" element={<TableView />} />
          <Route path="/generator/:id" element={<GeneratorDetails />} />
          {/* Placeholder routes for additional pages */}
          <Route path="/about" element={<div>About Page (Placeholder)</div>} />
          <Route path="/profile" element={<div>Profile Page (Placeholder)</div>} />
          <Route path="/settings" element={<div>Settings Page (Placeholder)</div>} />
        </Routes>
      </div>
    </Router>
  );
};

export default GeneratorMap;