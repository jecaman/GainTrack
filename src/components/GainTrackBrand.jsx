import React, { useState, useEffect } from 'react';

// GainTrack Logo Component with Moving Bright Point
// Nuevo logo con tres segmentos - primero y tercero idénticos, segundo paralelo
const GainTrackLogo = ({
  size = 32,
  color = "#00FF99",
  sloganGlow = false,
  isDarkMode = true
}) => {
  const [visible, setVisible] = useState(false);
  const [fade, setFade] = useState(false);

  // Lógica interna del glow con intervalo limpio
  useEffect(() => {
    if (sloganGlow) {
      const runGlowCycle = () => {
        setVisible(true);
        setFade(false);
        
        // Después de 2 segundos, iniciar fade
        setTimeout(() => {
          setFade(true);
          // Después de 0.4 segundos de fade, ocultar
          setTimeout(() => {
            setVisible(false);
          }, 400);
        }, 2000);
      };

      // Ejecutar inmediatamente
      runGlowCycle();
      
      // Repetir cada 6 segundos
      const interval = setInterval(runGlowCycle, 6000);
      
      return () => clearInterval(interval);
    } else {
      setVisible(false);
      setFade(false);
    }
  }, [sloganGlow]);

  // El path del nuevo logo para la animación (tres segmentos)
  const path = [
    { x: 2, y: 18 },   // A
    { x: 10, y: 8 },   // B  
    { x: 19, y: 15 },  // C
    { x: 27, y: 5 }    // D
  ];

  // Calcula la posición del punto moviéndose en línea recta entre puntos
  const getPointPosition = (progress) => {
    // Tres líneas rectas: A->B->C->D
    const points = [
      { x: 2, y: 18 },   // A
      { x: 10, y: 8 },   // B  
      { x: 19, y: 14 },  // C
      { x: 27, y: 5 }    // D
    ];
    
    // Asegurar que progress esté en rango [0,1]
    const clampedProgress = Math.max(0, Math.min(1, progress));
    
    // Dividir el progreso en 3 segmentos iguales
    const segmentProgress = clampedProgress * 3; // 0-3
    const segmentIndex = Math.floor(segmentProgress); // 0, 1, o 2
    const localProgress = segmentProgress - segmentIndex; // 0-1 dentro del segmento actual
    
    // Manejar el caso final cuando progress = 1.0
    if (segmentIndex >= 3) {
      return points[3]; // Punto final D
    }
    
    const startPoint = points[segmentIndex];
    const endPoint = points[segmentIndex + 1];
    
    // Interpolación lineal simple entre dos puntos
    const x = startPoint.x + (endPoint.x - startPoint.x) * localProgress;
    const y = startPoint.y + (endPoint.y - startPoint.y) * localProgress;
    
    return { x, y };
  };

  // Estado para animar el punto a lo largo del path
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!visible) {
      setProgress(0);
      return;
    }
    let start = null;
    let rafId = null;
    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      let p = Math.min(elapsed / 2000, 1); // 2 segundos para recorrer el path completo
      setProgress(p);
      if (p < 1) {
        rafId = requestAnimationFrame(animate);
      }
    };
    rafId = requestAnimationFrame(animate);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [visible]);

  // Calcula la posición del punto
  const punto = getPointPosition(progress);

  // Ajuste: el punto estaba ligeramente más abajo de lo que debería.
  // Para corregirlo, restamos un pequeño valor al cálculo de la posición top.
  // Por ejemplo, restamos 1.5px para subirlo un poco.
  const ajusteVerticalPx = 1.5;

  return (
    <div style={{ 
      position: 'relative', 
      display: 'inline-block',
      transform: 'scale(1)',
      transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      <svg width={size} height={Math.round(size * 24 / 32)} viewBox="0 0 32 24" fill="none" style={{ position: 'relative', zIndex: 1 }}>
        {/* GainTrack logo - tres segmentos con primero y tercero idénticos */}
        <path
          d="M2 20L10 8L18 16L26 4"
          stroke={color}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {/* Moving bright point - only in dark mode */}
      {visible && (
        <div
          style={{
            position: 'absolute',
            left: `${(punto.x / 32) * 100}%`,
            top: `${(punto.y / 24) * 100}%`,
            width: '6px',
            height: '6px',
            background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 25%, rgba(0,255,153,1) 45%, rgba(0,255,153,0.8) 65%, rgba(0,255,153,0.5) 85%, rgba(0,255,153,0.2) 95%, transparent 100%)',
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            filter: 'blur(0.8px) drop-shadow(0 0 6px rgba(255,255,255,1)) drop-shadow(0 0 12px rgba(0,255,153,1)) drop-shadow(0 0 18px rgba(0,255,153,0.8))',
            opacity: fade ? 0 : 1,
            transition: fade
              ? 'opacity 0.4s cubic-bezier(0.4,0,0.2,1)'
              : 'opacity 0.15s cubic-bezier(0.4,0,0.2,1)',
            zIndex: 15,
            boxShadow: `0 0 4px rgba(255,255,255,1), 0 0 8px rgba(0,255,153,1), 0 0 12px rgba(0,255,153,0.8), 0 0 16px rgba(0,255,153,0.6)`,
            pointerEvents: 'none'
          }}
        />
      )}
    </div>
  );
};

// GainTrack Brand Component - Logo + Título
const GainTrackBrand = ({
  logoSize = 50,
  titleSize = '24px',
  color = "#00FF99",
  titleColor = "#FFFFFF",
  sloganGlow = false,
  isDarkMode = true,
  layout = 'vertical', // 'vertical' | 'horizontal'
  logoRotation = 8,
  spacing = '8px',
  className = '',
  style = {}
}) => {
  const isVertical = layout === 'vertical';

  return (
    <div 
      className={className}
      style={{
        display: 'flex',
        flexDirection: isVertical ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing,
        ...style
      }}
    >
      <div style={{ 
        transform: `rotate(${logoRotation}deg)`,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <GainTrackLogo 
          size={logoSize} 
          color={color}
          sloganGlow={sloganGlow}
          isDarkMode={isDarkMode}
        />
      </div>
      <h1 style={{
        margin: 0,
        fontSize: titleSize,
        fontWeight: '700',
        color: titleColor,
        fontFamily: "'Inter', sans-serif",
        letterSpacing: '-0.02em',
        textAlign: 'center',
        textShadow: isDarkMode
          ? '0 0 20px rgba(255,255,255,0.12), 0 0 30px rgba(0,255,153,0.06)'
          : '0 0 8px rgba(0,0,0,0.06)'
      }}>
        GainTrack
      </h1>
    </div>
  );
};

export default GainTrackBrand;
export { GainTrackLogo };