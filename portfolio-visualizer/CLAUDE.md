# Instrucciones para Claude Code Assistant

## Estándares de Desarrollo

### Código y Estilo
- **Seguir patrones existentes**: Analizar el código existente antes de hacer cambios
- **Priorizar edición sobre creación**: Siempre editar archivos existentes cuando sea posible
- **Mantener consistencia**: Usar el mismo estilo de código en todo el proyecto
- **Idioma**: Usar español para comentarios, documentación y mensajes de usuario
- **No agregar comentarios**: Solo agregar comentarios si se solicita explícitamente

### Arquitectura del Proyecto
- **Separación clara**: Backend en `/backend/`, Frontend en `/src/`
- **Componentes modulares**: Cada componente React en archivo separado
- **Utilities**: Funciones auxiliares en `/src/utils/`
- **Documentación**: Archivos .md en la raíz del proyecto

## Estructura del Proyecto

```
portfolio-visualizer/
├── backend/
│   ├── main2.py             # Servidor FastAPI principal v2 (funciones modulares)
│   ├── kraken_pairs.py      # Lista de pares de trading (1099 líneas)
│   ├── requirements.txt     # 12 dependencias Python
│   └── trades_historico.csv # Datos históricos de trades
├── src/
│   ├── components/
│   │   ├── KPISection.jsx           # Dashboard KPIs (178 líneas)
│   │   ├── GeneralPerformanceSection.jsx  # Gráficos (448 líneas)
│   │   ├── AssetAnalysisSection.jsx       # Análisis activos (475 líneas)
│   │   ├── ApiForm.jsx              # Formulario conexión (889 líneas)
│   │   └── PortfolioCharts.jsx      # Componente gráficos (72 líneas)
│   ├── utils/
│   │   └── chartUtils.js    # Utilidades para gráficos
│   └── App.jsx              # Componente principal
├── package.json             # Dependencias Node.js
├── README.md               # Documentación principal
├── CLAUDE.md               # Este archivo
├── BACKLOG.md              # Tareas pendientes
└── DONE.md                 # Tareas completadas
```

## Comandos Importantes

### Backend
```bash
# Iniciar servidor backend
cd backend/
python3 main2.py

# Instalar dependencias
pip install -r requirements.txt

# Verificar imports
python3 -c "import main2; print('✅ Backend imports correctamente')"
```

### Frontend
```bash
# Iniciar desarrollo
npm run dev

# Instalar dependencias
npm install

# Build para producción
npm run build

# Linting
npm run lint
```

### URLs del Proyecto
- Backend: http://localhost:8001
- Frontend: http://localhost:5173
- API Docs: http://localhost:8001/docs

## Prioridades de Desarrollo

### 1. Funcionalidad Core (Alta)
- Mantener conexión estable con Kraken API
- Asegurar que los KPIs se calculen correctamente
- Verificar que los gráficos rendericen datos reales

### 2. Seguridad (Alta)
- **CRÍTICO**: Migrar credenciales hardcodeadas a variables de entorno
- Implementar validación de entrada
- Agregar rate limiting para API calls

### 3. Error Handling (Media)
- Manejo robusto de errores de API
- Estados de loading y error en frontend
- Validación de formularios

### 4. UI/UX Improvements (Media)
- Mantener diseño glass-morphism consistente
- Responsive design para móviles
- Mejoras de accesibilidad

### 5. Performance Optimization (Baja)
- Optimizar cache system (actualmente 5 minutos)
- Lazy loading de componentes
- Optimización de bundle size

## Contexto del Proyecto

### Estado Actual
- **Progreso**: 90% completado
- **Funcionalidades core**: ✅ Implementadas
- **Integración**: ✅ Backend-Frontend funcionando
- **Problema principal**: Credenciales hardcodeadas en código

### Funcionalidades Implementadas
- ✅ Conexión con Kraken API
- ✅ Sistema de caché inteligente (5 minutos)
- ✅ Dashboard de KPIs con 5 indicadores
- ✅ 4 tipos de gráficos interactivos
- ✅ Análisis individual de activos
- ✅ UI moderna con efectos visuales
- ✅ Responsive design

### Tecnologías Clave
- **Backend**: Python 3.8+, FastAPI, Pandas, krakenex, pykrakenapi
- **Frontend**: React 19, Vite, CSS personalizado, Chart.js
- **Tools**: ESLint, PostCSS

## Guías de Asistencia

### Al Recibir Solicitudes
1. **Analizar contexto**: Leer archivos relacionados antes de hacer cambios
2. **Usar TodoWrite**: Para tareas complejas, crear lista de tareas
3. **Seguir prioridades**: Enfocar en funcionalidad core primero
4. **Verificar funcionamiento**: Probar cambios cuando sea posible

### Al Hacer Cambios
1. **Leer primero**: Usar Read tool antes de Edit/Write
2. **Mantener patrones**: Seguir estilo existente en el código
3. **Documentar**: Actualizar DONE.md con cambios significativos
4. **Probar**: Verificar que los cambios no rompan funcionalidad

### Al Encontrar Problemas
1. **Seguridad**: Nunca ignorar problemas de seguridad
2. **Dependencies**: Verificar que todas las dependencias estén instaladas
3. **Compatibilidad**: Asegurar compatibilidad de versiones
4. **Testing**: Probar funcionalidad después de cambios

## Recordatorios Importantes

- **NUNCA** crear archivos nuevos sin necesidad absoluta
- **SIEMPRE** editar archivos existentes cuando sea posible
- **MANTENER** credenciales fuera del código (usar variables de entorno)
- **SEGUIR** los patrones de naming y estructura existentes
- **DOCUMENTAR** cambios importantes en DONE.md
- **PRIORIZAR** funcionalidad sobre estética
- **VERIFICAR** que el código funcione después de cambios

## Notas Especiales

- El proyecto usa React 19 con Vite, mantener compatibilidad
- Sistema de caché optimizado, no modificar sin entender el impacto
- UI usa glass-morphism, mantener consistencia visual
- Kraken API tiene rate limits, respetar el sistema de caché existente