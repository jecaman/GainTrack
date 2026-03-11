import { useRef, useLayoutEffect, useState } from 'react';

const SectionTabs = ({ activeSection, onSectionChange, theme, disabledOpsCount = 0 }) => {
  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'operations', label: 'Operations' },
    { id: 'portfolio', label: 'Portfolio' }
  ];

  const h2Refs = useRef({});

  const GAP = 20;       // px de espacio visual entre borde de texto activo y borde de texto lateral
  const SCALE = 0.85;
  const CENTER_X = 450;

  const activeIndex = sections.findIndex(s => s.id === activeSection);
  const leftIndex = (activeIndex - 1 + sections.length) % sections.length;
  const rightIndex = (activeIndex + 1) % sections.length;

  const [positions, setPositions] = useState({
    overview:   { x: CENTER_X,          scale: 1,     opacity: 1   },
    operations: { x: CENTER_X + 260,    scale: SCALE, opacity: 0.7 },
    portfolio:  { x: CENTER_X - 260,    scale: SCALE, opacity: 0.7 }
  });

  useLayoutEffect(() => {
    const activeId = sections[activeIndex].id;
    const leftId   = sections[leftIndex].id;
    const rightId  = sections[rightIndex].id;

    // offsetWidth da el ancho de layout (sin escala del padre)
    const activeW = h2Refs.current[activeId]?.offsetWidth || 220;
    const leftW   = h2Refs.current[leftId]?.offsetWidth   || 180;
    const rightW  = h2Refs.current[rightId]?.offsetWidth  || 180;

    // Gap medido desde borde de texto activo hasta borde de texto lateral (escala aplicada)
    // rightX - rightW*SCALE/2 = CENTER_X + activeW/2 + GAP  →  rightX = ...
    // leftX  + leftW*SCALE/2  = CENTER_X - activeW/2 - GAP  →  leftX  = ...
    setPositions({
      [activeId]: { x: CENTER_X,                                                    scale: 1,     opacity: 1   },
      [rightId]:  { x: CENTER_X + activeW / 2 + GAP + (rightW * SCALE) / 2,        scale: SCALE, opacity: 0.7 },
      [leftId]:   { x: CENTER_X - activeW / 2 - GAP - (leftW  * SCALE) / 2,        scale: SCALE, opacity: 0.7 }
    });
  }, [activeSection]);

  const sectionGradient = 'linear-gradient(90deg, rgba(120,120,120,0.6) 0%, rgba(200,200,200,0.85) 100%)';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'relative'
    }}>
      <div style={{ height: '80px', overflow: 'visible', marginBottom: '0rem' }}>
        <div style={{ position: 'relative', width: '900px', height: '80px' }}>
          {sections.map((section) => {
            const isActive = section.id === activeSection;
            const pos = positions[section.id] || { x: CENTER_X, scale: 1, opacity: 0 };

            return (
              <div
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    const h2 = e.currentTarget.querySelector('h2');
                    h2.style.background = 'linear-gradient(90deg, rgba(200,200,200,0.8) 0%, rgba(255,255,255,0.95) 100%)';
                    h2.style.WebkitBackgroundClip = 'text';
                    h2.style.WebkitTextFillColor = 'transparent';
                    h2.style.textShadow = '0 0 12px rgba(255,255,255,0.4), 0 0 20px rgba(255,255,255,0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    const h2 = e.currentTarget.querySelector('h2');
                    h2.style.background = sectionGradient;
                    h2.style.WebkitBackgroundClip = 'text';
                    h2.style.WebkitTextFillColor = 'transparent';
                    h2.style.textShadow = 'none';
                  }
                }}
                style={{
                  position: 'absolute',
                  left: `${pos.x}px`,
                  top: '20px',
                  transform: `translate(-50%, -50%) scale(${pos.scale})`,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'left 1.5s cubic-bezier(0.23, 1, 0.32, 1), transform 1.5s cubic-bezier(0.23, 1, 0.32, 1), opacity 1.5s cubic-bezier(0.23, 1, 0.32, 1)',
                  opacity: pos.opacity,
                  zIndex: isActive ? 10 : 1,
                  transformStyle: 'preserve-3d',
                  whiteSpace: 'nowrap'
                }}
              >
                <h2
                  ref={el => { h2Refs.current[section.id] = el; }}
                  style={{
                    margin: 0,
                    position: 'relative',
                    fontSize: isActive ? '2.6rem' : '2.2rem',
                    fontVariationSettings: `'wght' ${isActive ? 510 : 400}`,
                    fontWeight: 'normal',
                    color: isActive ? '#ffffff' : theme.textSecondary,
                    background: isActive ? 'transparent' : sectionGradient,
                    WebkitBackgroundClip: isActive ? 'initial' : 'text',
                    WebkitTextFillColor: isActive ? '#ffffff' : 'transparent',
                    textShadow: isActive
                      ? '0 0 8px rgba(255,255,255,0.3), 0 0 12px rgba(255,255,255,0.2)'
                      : 'none',
                    fontFamily: "'Inter', sans-serif",
                    letterSpacing: isActive ? '1px' : '0.5px',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    // font-size sin transición para que offsetWidth en useLayoutEffect sea preciso
                    transition: 'color 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94), background 3s cubic-bezier(0.23, 1, 0.32, 1), text-shadow 3s cubic-bezier(0.23, 1, 0.32, 1)',
                    marginBottom: isActive ? '0.6rem' : '0'
                  }}
                >
                  {section.label}
                  {section.id === 'operations' && disabledOpsCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-18px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '20px',
                      height: '20px',
                      padding: '0 5px',
                      background: '#00ff88',
                      borderRadius: '10px',
                      fontSize: '0.65rem',
                      fontWeight: '800',
                      color: '#000',
                      fontFamily: 'monospace',
                      letterSpacing: '0',
                      boxShadow: '0 0 12px rgba(0,255,136,0.5), 0 0 24px rgba(0,255,136,0.25)',
                      WebkitTextFillColor: '#000',
                      textShadow: 'none',
                    }}>
                      {disabledOpsCount}
                    </span>
                  )}
                </h2>

                {isActive && (
                  <div style={{
                    width: '40px',
                    height: '2px',
                    background: '#00FF99',
                    boxShadow: '0 0 10px rgba(0,255,153,0.6), 0 0 16px rgba(0,255,153,0.4), 0 0 22px rgba(0,255,153,0.25)',
                    margin: '0 auto',
                    transition: 'all 1.5s cubic-bezier(0.23, 1, 0.32, 1)',
                    opacity: 1,
                    borderRadius: '1px'
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
