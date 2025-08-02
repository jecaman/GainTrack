import { RotateCcw } from 'lucide-react';
import GainTrackBrand from '../GainTrackBrand';
import SectionTabs from './Navigation/SectionTabs';

const Header = ({ 
  theme, 
  activeSection, 
  onSectionChange, 
  onBackToForm, 
  onToggleTheme, 
  sidebarOpen 
}) => {
  // Componente separador reutilizable
  const Separator = () => (
    <div style={{
      width: '1px',
      height: '16px',
      background: theme.borderColor,
      opacity: 1
    }} />
  );

  // Función para manejar hover del botón refresh
  const handleRefreshHover = (isHover) => (e) => {
    const button = e.currentTarget.querySelector('button');
    const svg = e.currentTarget.querySelector('svg');
    
    if (isHover) {
      button.style.borderColor = '#00FF99';
      button.style.background = 'rgba(0,255,153,0.05)';
      button.style.transform = 'translateY(18px) rotate(-90deg)';
      svg.style.color = '#00FF99';
    } else {
      button.style.borderColor = theme.borderColor + '60';
      button.style.background = 'transparent';
      button.style.transform = 'translateY(18px) rotate(0deg)';
      svg.style.color = 'white';
    }
  };

  return (
    <div style={{
      padding: 'clamp(4rem, 8vw, 6rem) clamp(1rem, 4vw, 2rem) 0.5rem',
      background: `linear-gradient(180deg, ${theme.bg}00 0%, ${theme.bg}05 100%)`
    }}>
      {/* Navegación centrada */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center'
      }}>
        <SectionTabs
          activeSection={activeSection}
          onSectionChange={onSectionChange}
          theme={theme}
          onBackToForm={onBackToForm}
          onToggleTheme={onToggleTheme}
          sidebarOpen={sidebarOpen}
        />
      </div>

      {/* Línea inferior: Logo + Subtítulo + Status */}
      <div style={{
        transform: 'translateY(-150px)',
        position: 'relative',
        height: '220px'
      }}>
        {/* Logo con subtítulo a la izquierda */}
        <div style={{ 
          position: 'absolute',
          left: '0',
          bottom: '40%',
          display: 'flex', 
          alignItems: 'flex-end', 
          gap: 'clamp(0.8rem, 2vw, 1.5rem)',
          flexWrap: 'wrap'
        }}>
          <div style={{ 
            alignSelf: 'flex-end',
            transform: 'translateY(8px)'
          }}>
            <GainTrackBrand
              logoSize={42}
              titleSize="clamp(20px, 4vw, 26px)"
              color="#00FF99"
              titleColor={theme.textPrimary}
              sloganGlow={true}
              isDarkMode={theme.bg === '#000000'}
              layout="horizontal"
              logoRotation={4}
              spacing="6px"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                letterSpacing: '-0.005em'
              }}
            />
          </div>
          
          {/* Subtítulo a la derecha del branding */}
          <div style={{
            fontSize: 'clamp(12px, 2vw, 14px)',
            color: theme.textSecondary,
            opacity: 0.8,
            fontFamily: "'Inter', sans-serif",
            letterSpacing: '0.3px',
            paddingLeft: 'clamp(0.5rem, 2vw, 1rem)',
            borderLeft: `1px solid ${theme.borderColor}`,
            minWidth: '120px'
          }}>
            <div style={{ 
              fontSize: 'clamp(9px, 1.5vw, 11px)', 
              opacity: 0.6, 
              textTransform: 'uppercase', 
              letterSpacing: '0.5px',
              marginBottom: '2px'
            }}>
              Portfolio Dashboard
            </div>
            <div style={{ 
              fontSize: 'clamp(11px, 2vw, 13px)', 
              fontWeight: '500', 
              color: theme.textPrimary 
            }}>
              Real-time Analytics
            </div>
          </div>
        </div>

        {/* Status line a la derecha */}
        <div style={{
          position: 'absolute',
          right: '0px',
          bottom: '40%',
          display: 'flex',
          alignItems: 'flex-end',
          gap: 'clamp(0.3rem, 1vw, 0.5rem)',
          fontSize: 'clamp(10px, 1.5vw, 12px)',
          color: theme.textSecondary,
          flexWrap: 'wrap',
          justifyContent: 'flex-end'
        }}>
          {/* Connection Type */}
          <span style={{ 
            fontWeight: '500', 
            color: theme.textPrimary,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            whiteSpace: 'nowrap'
          }}>
            API Connection
          </span>

          <Separator />

          {/* Last Sync */}
          <span style={{ 
            color: theme.textSecondary,
            whiteSpace: 'nowrap'
          }}>
            LAST SYNC: {new Date().toLocaleTimeString('en-US', { 
              hour12: false, 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>

          <Separator />

          {/* Kraken Status */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            whiteSpace: 'nowrap'
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#00FF99',
              boxShadow: '0 0 6px rgba(0,255,153,0.6)'
            }} />
            <span style={{ 
              fontWeight: '500', 
              color: '#00FF99',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              KRAKEN
            </span>
          </div>

          <Separator />

          {/* Refresh Button */}
          <div 
            style={{
              padding: '15px',
              cursor: 'pointer'
            }}
            onClick={() => console.log('Refresh clicked')}
            onMouseEnter={handleRefreshHover(true)}
            onMouseLeave={handleRefreshHover(false)}
          >
            <button
              style={{
                background: 'transparent',
                border: `1px solid ${theme.borderColor}60`,
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                cursor: 'pointer',
                color: theme.textSecondary,
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: 'translateY(18px)',
                padding: '0'
              }}
            >
              <RotateCcw size={12} color="white" />
            </button>
          </div>
        </div>
      </div>

      {/* Línea divisora */}
      <div style={{
        borderBottom: `2px solid ${theme.borderColor}60`,
        transform: 'translateY(-230px)',
        position: 'fixed',
        left: '0',
        right: '0',
        zIndex: '1'
      }} />
    </div>
  );
};

export default Header;