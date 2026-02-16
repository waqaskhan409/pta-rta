import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import '../styles/Splash.css';

function SplashScreen({ onComplete = () => { } }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Show splash screen for 2.5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <Box className="splash-container">
      <Box className="splash-content">
        <Box className="splash-logo-container">
          <Box className="splash-logo">
            <div className="logo-circle"></div>
            <div className="logo-circle delay-1"></div>
            <div className="logo-circle delay-2"></div>
          </Box>
        </Box>

        <Typography variant="h3" className="splash-title">
          PTA-RTA
        </Typography>

        <Typography variant="subtitle1" className="splash-subtitle">
          Permit Management System
        </Typography>

        <Box className="splash-loader">
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </Box>

        <Typography variant="caption" className="splash-version">
          v1.0.0
        </Typography>
      </Box>
    </Box>
  );
}

export default SplashScreen;
