
const SectionTabs = ({ activeSection, onSectionChange, theme, onBackToForm, onToggleTheme, sidebarOpen }) => {
  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'portfolio', label: 'Portfolio' }
  ];

  // Calcular el índice de la sección activa
  const activeIndex = sections.findIndex(section => section.id === activeSection);
  
  // Reordenar las secciones para que la activa esté siempre en el centro
  const getOrderedSections = () => {
    const result = [];
    
    // Posición izquierda (anterior)
    const leftIndex = (activeIndex - 1 + sections.length) % sections.length;
    result.push({ ...sections[leftIndex], position: 'left' });
    
    // Posición centro (activa)
    result.push({ ...sections[activeIndex], position: 'center' });
    
    // Posición derecha (siguiente)
    const rightIndex = (activeIndex + 1) % sections.length;
    result.push({ ...sections[rightIndex], position: 'right' });
    
    return result;
  };

  const orderedSections = getOrderedSections();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'relative'
    }}>
      {/* Back Button - fixed top left */}
      <button
        onClick={onBackToForm || (() => console.log('Back clicked'))}
        style={{
          position: 'fixed',
          left: '1.5rem',
          top: '1.5rem',
          zIndex: 100,
          background: 'transparent',
          border: `1px solid ${theme.borderColor}`,
          borderRadius: '8px',
          padding: '8px 16px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          fontWeight: '500',
          color: theme.textSecondary,
          fontFamily: "'Inter', sans-serif",
          zIndex: 25,
          backdropFilter: 'blur(10px)'
        }}
        onMouseEnter={(e) => {
          e.target.style.borderColor = theme.accentPrimary;
          e.target.style.color = theme.textPrimary;
          e.target.style.background = `${theme.accentPrimary}10`;
          e.target.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.target.style.borderColor = theme.borderColor;
          e.target.style.color = theme.textSecondary;
          e.target.style.background = 'transparent';
          e.target.style.transform = 'translateY(0)';
        }}
      >
        <span style={{ fontSize: '16px' }}>←</span>
        Back to Form
      </button>

      {/* Theme Toggle Button - fixed top right */}
      <button
        onClick={onToggleTheme || (() => console.log('Theme toggle clicked'))}
        style={{
          position: 'fixed',
          right: sidebarOpen ? '370px' : '1.5rem',
          top: '1.5rem',
          zIndex: 100,
          width: '65px',
          height: '36px',
          background: theme.bg === '#000000' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          border: `2px solid ${theme.bg === '#000000' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'}`,
          borderRadius: '20px',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          padding: '2px',
          display: 'flex',
          alignItems: 'center',
          backdropFilter: 'blur(8px)'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = theme.bg === '#000000' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)';
          e.target.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = theme.bg === '#000000' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
          e.target.style.transform = 'scale(1)';
        }}
      >
        {/* Toggle circle */}
        <div style={{
          width: '29px',
          height: '29px',
          background: theme.bg === '#000000' ? '#6b7280' : '#4b5563',
          borderRadius: '50%',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: theme.bg === '#000000' ? 'translateX(0)' : 'translateX(29px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '13px',
          filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))'
        }}>
          {theme.bg === '#000000' ? '🌙' : '☀️'}
        </div>
      </button>


      <div style={{
        height: '80px',
        overflow: 'visible',
        marginBottom: '0rem'
      }}>
      <div style={{
        position: 'relative',
        width: '600px',
        height: '80px'
      }}>
        {sections.map((section, index) => {
          const isActive = section.id === activeSection;
          
          // Calcular rotación circular completa
          const centerX = 300;
          const centerY = 40;
          const spacing = 180;
          
          // Ángulo base de cada sección (120° entre ellas)
          const sectionAngle = index * 120;
          // Ángulo de rotación para centrar la sección activa
          const rotationOffset = activeIndex * -120;
          // Ángulo final de esta sección
          const finalAngle = sectionAngle + rotationOffset;
          
          // Convertir ángulo a posición horizontal
          // 0° = centro, -120° = izquierda, +120° = derecha
          let x, scale, opacity;
          
          const normalizedAngle = ((finalAngle % 360) + 360) % 360;
          
          if (normalizedAngle === 0 || Math.abs(normalizedAngle - 360) < 1) {
            // Centro
            x = centerX;
            scale = 1;
            opacity = 1;
          } else if (Math.abs(normalizedAngle - 240) < 1) {
            // Izquierda (240° = -120°)
            x = centerX - spacing;
            scale = 0.85;
            opacity = 0.7;
          } else if (Math.abs(normalizedAngle - 120) < 1) {
            // Derecha
            x = centerX + spacing;
            scale = 0.85;
            opacity = 0.7;
          } else {
            // Posición intermedia durante transición
            const angleRad = (finalAngle * Math.PI) / 180;
            x = centerX + Math.cos(angleRad) * spacing;
            scale = 0.85;
            opacity = 0.7;
          }
          
          const y = centerY - 20;
          
          return (
            <div
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              style={{
                position: 'absolute',
                left: `${x}px`,
                top: `${y}px`,
                transform: `translate(-50%, -50%) scale(${scale})`,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
                opacity: opacity,
                zIndex: isActive ? 10 : 1,
                transformStyle: 'preserve-3d'
              }}
            >
              <h2 style={{
                margin: 0,
                fontSize: isActive ? '1.8rem' : '1.4rem',
                fontWeight: isActive ? '500' : '400',
                color: isActive ? '#ffffff' : theme.textSecondary,
                fontFamily: "'Inter', sans-serif",
                letterSpacing: isActive ? '1px' : '0.5px',
                textTransform: 'uppercase',
                transition: 'all 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
                marginBottom: isActive ? '0.6rem' : '0'
              }}>
                {section.label}
              </h2>
              
              {/* Línea inferior - solo para el elemento activo */}
              {isActive && (
                <div style={{
                  width: '40px',
                  height: '1px',
                  background: '#ffffff',
                  margin: '0 auto',
                  transition: 'all 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  opacity: 0.8
                }} />
              )}
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
};

export default SectionTabs;