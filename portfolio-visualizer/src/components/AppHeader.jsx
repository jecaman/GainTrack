import React from 'react';
import GainTrackBrand from './GainTrackBrand';

const AppHeader = ({ 
  theme, 
  sloganGlow = false, 
  style = {},
  className = ''
}) => {
  const isDarkMode = theme?.bg === '#000000' || theme?.bg === 'black';
  
  return (
    <div 
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 'clamp(0.5rem, 1.5vw, 0.625rem)',
        ...style
      }}
    >
      <GainTrackBrand 
        logoSize={40}
        titleSize="clamp(20px, 5vw, 26px)"
        color="#00FF99"
        titleColor={theme?.textPrimary || "#FFFFFF"}
        sloganGlow={sloganGlow}
        isDarkMode={isDarkMode}
        layout="horizontal"
        logoRotation={8}
        spacing="2px"
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          letterSpacing: '-0.02em',
          transition: 'color 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          lineHeight: '1'
        }}
      />
    </div>
  );
};

export default AppHeader;