# Backlog de Tareas - Portfolio Visualizer

## 🔴 Alta Prioridad

### Seguridad
- [ ] **Migrar credenciales API a variables de entorno**
  - Crear archivo `.env` en backend/
  - Actualizar main.py para usar `os.getenv()`
  - Agregar `.env` a `.gitignore`
  - Documentar configuración de variables de entorno

- [ ] **Implementar validación de entrada robusta**
  - Validar credenciales API antes de usar
  - Agregar esquemas Pydantic para requests
  - Implementar sanitización de datos de entrada

### Error Handling
- [ ] **Mejorar manejo de errores en backend**
  - Capturar errores específicos de Kraken API
  - Implementar retry logic para llamadas fallidas
  - Agregar logging estructurado
  - Crear respuestas de error consistentes

- [ ] **Agregar estados de error en frontend**
  - Mostrar mensajes de error amigables
  - Implementar estados de loading
  - Agregar indicadores de conexión
  - Manejar timeouts de API

### Funcionalidad Core
- [ ] **Mejorar cálculos KPI con datos reales**
  - Integrar precios actuales de mercado
  - Calcular profit/loss real vs aproximado
  - Implementar conversiones de moneda precisas
  - Agregar métricas de rendimiento temporal

## 🟡 Media Prioridad

### UI/UX Improvements
- [ ] **Agregar más tipos de gráficos**
  - Gráfico de distribución de activos (pie chart)
  - Gráfico de evolución temporal del portfolio
  - Gráfico de comparación con índices de mercado
  - Heatmap de rendimiento por activo

- [ ] **Implementar filtros avanzados**
  - Filtros por rango de fechas
  - Filtros por tipo de activo
  - Filtros por volumen de trading
  - Búsqueda de activos específicos

- [ ] **Mejorar experiencia móvil**
  - Optimizar gráficos para pantallas pequeñas
  - Implementar navegación touch-friendly
  - Agregar gestos de swipe
  - Optimizar velocidad de carga móvil

### Performance
- [ ] **Optimizar rendimiento de gráficos**
  - Implementar lazy loading de gráficos
  - Optimizar re-renders con React.memo
  - Agregar virtualization para listas largas
  - Implementar progressive loading

- [ ] **Mejorar sistema de caché**
  - Cache selectivo por endpoint
  - Invalidación inteligente de cache
  - Comprimir datos en cache
  - Implementar cache persistente

### UI Improvements (Post optimización API)
- [ ] **Cambiar formato moneda y flecha**
  - Mejorar visualización de monedas en la aplicación
  - Actualizar iconografía de flechas para indicadores

- [ ] **Mejoras tabla AssetLeaderboard**
  - Añadir barra de progreso visual en la columna de porcentaje (%)
  - Agregar nueva columna "Avg Cost" con precio medio de compra
  - Mejorar visualización de datos tabulares

### Features
- [ ] **Filtro de assets por valor mínimo**
  - Por defecto ocultar assets por debajo de X€ (ej: 5€)
  - Toggle en Filters para "Mostrar assets pequeños"
  - Evitar mostrar residuos de ventas (ej: 0.0001 TRUMP)
  - Configuración personalizable del umbral mínimo

- [ ] **Configuración de notación numérica**
  - Toggle entre notación EU (, para decimales) y US (. para decimales)
  - Guardar preferencia en configuración del usuario
  - Aplicar consistentemente en toda la aplicación
  - Configuración accesible desde panel de ajustes

- [ ] **Soporte para trades crypto-to-crypto**
  - Incluir compras hechas con activos no-fiat
  - Calcular cost basis cuando se compra con BTC/ETH/etc
  - Tracking de conversiones entre cryptos
  - Histórico de swaps internos

- [ ] **Agregar notificaciones**
  - Alertas de cambios significativos
  - Notificaciones push para móvil
  - Configuración de umbral personalizable
  - Historial de notificaciones

- [ ] **Implementar análisis avanzado**
  - Cálculo de Sharpe ratio
  - Análisis de volatilidad
  - Correlación entre activos
  - Sugerencias de rebalanceo

## 🟢 Baja Prioridad

### Personalización
- [ ] **Tema oscuro/claro**
  - Toggle de tema en UI
  - Persistir preferencia de tema
  - Optimizar colores para ambos temas
  - Transiciones suaves entre temas

- [ ] **Configuración personalizable**
  - Personalizar dashboard layout
  - Configurar KPIs mostrados
  - Personalizar rangos de tiempo
  - Guardar configuración de usuario

### Exportación y Reporting
- [ ] **Exportación de datos**
  - Exportar a CSV/Excel
  - Exportar gráficos como imágenes
  - Generar reportes PDF
  - Programar reportes automáticos

- [ ] **Integración con herramientas externas**
  - Webhook para actualizaciones
  - API para terceros
  - Integración con Google Sheets
  - Exportar a herramientas de contabilidad

### Escalabilidad
- [ ] **Integración con otras exchanges**
  - Binance API integration
  - Coinbase Pro API
  - Soporte multi-exchange
  - Consolidación de datos

- [ ] **Análisis predictivo**
  - Machine learning para predicciones
  - Análisis de tendencias
  - Backtesting de estrategias
  - Alertas predictivas

## 🔧 Mejoras Técnicas

### DevOps
- [ ] **Configuración Docker**
  - Dockerfile para backend
  - Dockerfile para frontend
  - Docker-compose para desarrollo
  - Configuración de producción

- [ ] **CI/CD Pipeline**
  - GitHub Actions setup
  - Tests automatizados
  - Deployment automatizado
  - Code quality checks

### Testing
- [ ] **Tests unitarios**
  - Tests para backend Python
  - Tests para componentes React
  - Tests de integración API
  - Coverage reporting

- [ ] **Tests end-to-end**
  - Cypress/Playwright setup
  - Tests de flujo completo
  - Tests de performance
  - Tests de accesibilidad

### Documentación
- [ ] **Documentación API completa**
  - OpenAPI specs detalladas
  - Ejemplos de uso
  - Códigos de error documentados
  - Postman collection

- [ ] **Documentación de desarrollo**
  - Guías de contribución
  - Arquitectura del sistema
  - Patrones de código
  - Troubleshooting guide

## 📋 Notas y Consideraciones

### Dependencias Técnicas
- Algunas tareas requieren completar migración de credenciales primero
- Performance improvements dependen de error handling robusto
- Features avanzadas requieren base estable de funcionalidad core

### Estimaciones de Tiempo
- **Alta prioridad**: 4-6 horas total
- **Media prioridad**: 8-12 horas total
- **Baja prioridad**: 15-20 horas total

### Recursos Necesarios
- Acceso a diferentes APIs de exchanges para integraciones
- Herramientas de testing y CI/CD
- Servidor de producción para deployment
- Documentación técnica de APIs externas

---

*Última actualización: 2025-01-09*