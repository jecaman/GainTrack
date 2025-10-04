#!/bin/bash
"""
Script para configurar cron job que actualice precios históricos diariamente
Ejecuta a las 01:00 AM todos los días
"""

# Obtener directorio actual
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_SCRIPT="$SCRIPT_DIR/actualizar_historicos.py"
LOG_FILE="$SCRIPT_DIR/logs/historicos.log"

# Crear directorio de logs si no existe
mkdir -p "$SCRIPT_DIR/logs"

# Obtener ruta de Python
PYTHON_PATH=$(which python3)

echo "🔧 Configurando cron job para actualización histórica..."
echo "📁 Script: $PYTHON_SCRIPT"
echo "📝 Logs: $LOG_FILE"
echo "🐍 Python: $PYTHON_PATH"

# Crear entrada de cron
CRON_ENTRY="0 1 * * * cd $SCRIPT_DIR && $PYTHON_PATH $PYTHON_SCRIPT >> $LOG_FILE 2>&1"

# Agregar al crontab (evitando duplicados)
(crontab -l 2>/dev/null | grep -v "actualizar_historicos.py"; echo "$CRON_ENTRY") | crontab -

echo "✅ Cron job configurado:"
echo "   - Se ejecutará todos los días a las 01:00 AM"
echo "   - Logs se guardarán en: $LOG_FILE"
echo ""
echo "📋 Para verificar: crontab -l"
echo "📋 Para ver logs: tail -f $LOG_FILE"
echo "📋 Para probar manualmente: cd $SCRIPT_DIR && python3 actualizar_historicos.py"