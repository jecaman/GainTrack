# Portfolio Visualizer - Kraken Trading Analytics

## Descripción
Aplicación web completa para análisis y visualización de portfolios de criptomonedas en Kraken. Combina un backend Python con FastAPI y un frontend React moderno para proporcionar análisis detallados de inversiones y visualizaciones interactivas.

## Características Principales
- **Dashboard de KPIs en tiempo real**: Métricas clave del portfolio actualizadas
- **Gráficos interactivos de rendimiento**: Visualizaciones con Chart.js
- **Análisis histórico de trades**: Procesamiento completo del historial de transacciones
- **Sistema de caché inteligente**: Optimización de llamadas API (5 minutos)
- **UI moderna con glass-morphism**: Diseño responsivo con CSS personalizado

## Arquitectura del Sistema

### Backend (Python/FastAPI)
- **Framework**: FastAPI con Uvicorn
- **API Integration**: krakenex y pykrakenapi
- **Data Processing**: Pandas para análisis de datos
- **Cache System**: Sistema de caché de 5 minutos para optimizar rendimiento

### Frontend (React/Vite)
- **Framework**: React 19 con Vite
- **Styling**: CSS moderno con efectos visuales
- **Charts**: Chart.js con react-chartjs-2
- **Components**: Arquitectura modular de componentes

## Instalación Rápida

### Requisitos Previos
- Python 3.8+
- Node.js 18+
- npm o yarn
- Cuenta y credenciales de Kraken API

### Backend
```bash
cd backend/
pip install -r requirements.txt
python3 main.py
```

### Frontend
```bash
npm install
npm run dev
```

## Uso

1. **Iniciar el backend**: El servidor se ejecuta en `http://localhost:8000`
2. **Iniciar el frontend**: La aplicación web está disponible en `http://localhost:5173`
3. **Configurar credenciales**: Usar las credenciales de Kraken API (ver CLAUDE.md para migrar a variables de entorno)
4. **Explorar el dashboard**: Visualizar KPIs, gráficos y análisis del portfolio

## Estructura del Proyecto

```
portfolio-visualizer/
├── .gitignore              # Archivos ignorados por Git
├── README.md               # Esta documentación
├── CLAUDE.md               # Guías para desarrollo
├── BACKLOG.md              # Tareas pendientes
├── DONE.md                 # Tareas completadas
├── package.json            # Dependencias Node.js
├── vite.config.js          # Configuración Vite
├── eslint.config.js        # Configuración ESLint
├── backend/
│   ├── main.py             # Servidor FastAPI principal
│   ├── kraken_pairs.py     # Lista de pares de trading
│   └── requirements.txt    # Dependencias Python
├── src/
│   ├── components/
│   │   ├── ApiForm.jsx     # Formulario de conexión API
│   │   ├── ApiFormPage.jsx # Página del formulario
│   │   ├── KPISection.jsx  # Dashboard de KPIs
│   │   ├── GeneralPerformanceSection.jsx  # Gráficos de rendimiento
│   │   ├── AssetAnalysisSection.jsx       # Análisis de activos
│   │   ├── PortfolioCharts.jsx      # Componente de gráficos
│   │   └── PortfolioPage.jsx        # Página principal del portfolio
│   ├── utils/
│   │   └── chartUtils.js   # Utilidades para gráficos
│   ├── App.jsx             # Componente principal
│   ├── main.jsx            # Punto de entrada
│   └── index.css           # Estilos globales
└── public/
    ├── logo.png            # Logo del proyecto
    ├── bitcoin.svg         # Icono Bitcoin
    └── vite.svg            # Icono Vite
```

## Endpoints API

- `POST /api/portfolio`: Datos completos del portfolio (incluye KPIs)
- `GET /docs`: Documentación interactiva de la API

## Estado del Proyecto

**Progreso**: 90% completado

### Funcionalidades Implementadas ✅
- Conexión con Kraken API
- Sistema de caché optimizado
- Dashboard de KPIs
- Gráficos interactivos
- UI moderna y responsiva

### Próximos Pasos 🔄
- Migrar credenciales a variables de entorno
- Mejorar manejo de errores
- Agregar validación de entrada
- Configuración de producción

## Tecnologías Utilizadas

- **Backend**: Python, FastAPI, Pandas, Kraken API
- **Frontend**: React 19, Vite, CSS personalizado, Chart.js
- **Tools**: ESLint, PostCSS

## Contribuir

Ver `CLAUDE.md` para estándares de desarrollo y `BACKLOG.md` para tareas pendientes.

## Licencia

Proyecto personal de análisis de portfolio de criptomonedas.
