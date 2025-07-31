const SectionTabs = ({ activeSection, onSectionChange, theme }) => {
  const sections = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'portfolio', label: 'Portfolio', icon: '💼' }
  ];

  return (
    <div style={{
      display: 'flex',
      gap: '1rem',
      marginBottom: '2rem',
      borderBottom: `1px solid ${theme.borderColor}`,
      position: 'sticky',
      top: 0,
      background: theme.bg,
      zIndex: 10,
      padding: '1rem 0'
    }}>
      {sections.map(section => (
        <button
          key={section.id}
          onClick={() => onSectionChange(section.id)}
          style={{
            padding: '0.75rem 1.5rem',
            background: activeSection === section.id ? theme.accentPrimary : 'transparent',
            color: activeSection === section.id ? theme.bg : theme.textSecondary,
            border: `1px solid ${activeSection === section.id ? theme.accentPrimary : theme.borderColor}`,
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            fontFamily: "'Inter', sans-serif",
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
          onMouseEnter={(e) => {
            if (activeSection !== section.id) {
              e.target.style.borderColor = theme.accentPrimary;
              e.target.style.color = theme.textPrimary;
            }
          }}
          onMouseLeave={(e) => {
            if (activeSection !== section.id) {
              e.target.style.borderColor = theme.borderColor;
              e.target.style.color = theme.textSecondary;
            }
          }}
        >
          <span>{section.icon}</span>
          {section.label}
        </button>
      ))}
    </div>
  );
};

export default SectionTabs;