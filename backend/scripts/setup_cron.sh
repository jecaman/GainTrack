#!/bin/bash
# Script para configurar cron job que actualice precios históricos diariamente
# Ejecuta a las 00:05 AM todos los días con rotación de logs

set -e

# Obtener directorio actual
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_SCRIPT="$SCRIPT_DIR/actualizar_historicos.py"
LOG_DIR="$SCRIPT_DIR/logs"
LOG_FILE="$LOG_DIR/historicos.log"

# Crear directorio de logs si no existe
mkdir -p "$LOG_DIR"

# Obtener ruta de Python
PYTHON_PATH=$(which python3)

echo "Setting up daily price update cron job..."
echo "  Script: $PYTHON_SCRIPT"
echo "  Logs:   $LOG_FILE"
echo "  Python: $PYTHON_PATH"

# Wrapper script que rotará logs y ejecutará la actualización
WRAPPER="$SCRIPT_DIR/run_daily_update.sh"
cat > "$WRAPPER" << 'WRAPPER_EOF'
#!/bin/bash
# Auto-generated wrapper for daily price update
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
LOG_FILE="$LOG_DIR/historicos.log"

# Rotate log if > 5 MB
MAX_LOG_SIZE=$((5 * 1024 * 1024))
if [ -f "$LOG_FILE" ] && [ $(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE" 2>/dev/null) -gt $MAX_LOG_SIZE ]; then
    mv "$LOG_FILE" "$LOG_FILE.$(date +%Y%m%d_%H%M%S).bak"
    # Keep only last 3 backups
    ls -t "$LOG_DIR"/historicos.log.*.bak 2>/dev/null | tail -n +4 | xargs -r rm
fi

echo "========================================" >> "$LOG_FILE"
echo "RUN: $(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"

cd "$SCRIPT_DIR"
PYTHON_PATH=$(which python3)
$PYTHON_PATH "$SCRIPT_DIR/actualizar_historicos.py" >> "$LOG_FILE" 2>&1
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
    echo "[CRON ERROR] Exit code: $EXIT_CODE — check $LOG_FILE" >> "$LOG_FILE"
fi

echo "" >> "$LOG_FILE"
exit $EXIT_CODE
WRAPPER_EOF

chmod +x "$WRAPPER"

# Crear entrada de cron — 00:05 AM diario
CRON_ENTRY="5 0 * * * $WRAPPER"

# Agregar al crontab (evitando duplicados)
(crontab -l 2>/dev/null | grep -v "actualizar_historicos\|run_daily_update"; echo "$CRON_ENTRY") | crontab -

echo ""
echo "Cron job configured:"
echo "  Schedule: daily at 00:05 AM"
echo "  Log rotation: at 5 MB, keeps last 3 backups"
echo ""
echo "Commands:"
echo "  Verify:   crontab -l"
echo "  Logs:     tail -f $LOG_FILE"
echo "  Test run: $WRAPPER"
