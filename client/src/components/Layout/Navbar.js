import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useFiles } from '../../contexts/FileContext';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { clearContext } = useFiles();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    clearContext();
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <div className="logo">
            <img src="/favicon.ico" alt="Drive Logo" width="32" height="32" />
            <span className="logo-text">Drive</span>
          </div>
        </div>

        <div className="navbar-right">
          <button
            onClick={toggleTheme}
            className="theme-toggle"
            aria-label="Toggle theme"
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M9 2c-1.05 0-2.05.16-3 .46 4.06 1.27 7 5.06 7 9.54 0 4.48-2.94 8.27-7 9.54.95.3 1.95.46 3 .46 5.52 0 10-4.48 10-10S14.52 2 9 2z"/>
              </svg>
            )}
          </button>

          <div className="user-menu">
            <button
              className="user-avatar"
              onClick={() => setShowDropdown(!showDropdown)}
              aria-label="User menu"
            >
              {user.image ? (
                <img src={user.image} alt={user.firstName} className="avatar-image" />
              ) : (
                <div className="avatar-placeholder">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </div>
              )}
            </button>

            {showDropdown && (
              <>
                <div className="dropdown-overlay" onClick={() => setShowDropdown(false)} />
                <div className="user-dropdown">
                  <div className="dropdown-header">
                    <div className="dropdown-avatar">
                      {user.image ? (
                        <img src={user.image} alt={user.firstName} />
                      ) : (
                        <div className="avatar-placeholder">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </div>
                      )}
                    </div>
                    <div className="dropdown-user-info">
                      <div className="user-name">{user.firstName} {user.lastName}</div>
                      <div className="user-username">@{user.username}</div>
                    </div>
                  </div>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item" onClick={handleLogout}>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                    </svg>
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
