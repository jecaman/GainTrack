# =============================================================================
# CONFIGURACIÓN Y CONSTANTES
# =============================================================================

# Assets fiat reconocidos por Kraken
FIAT_ASSETS = ["ZEUR", "ZUSD", "ZGBP", "ZCAD", "ZJPY", "ZCHF", "ZKRW", "ZUSDT", "ZUSDC"]

# Cache dinámico de pares exitosos (se va llenando automáticamente)
DYNAMIC_PAIR_CACHE = {
    # Pares conocidos que sabemos que funcionan
    'BTC': 'XXBTZEUR',
    'XRP': 'XXRPZEUR', 
    'ETH': 'XETHZEUR',
    'TRUMP': 'TRUMP/EUR',
}

# Assets conocidos como deslistados o problemáticos (se actualiza automáticamente)
DELISTED_ASSETS = set()  # Empezar vacío, se llenará automáticamente si es necesario

# Configuración de cache
PRIVATE_CACHE_DURATION = 300  # 5 minutos
PUBLIC_CACHE_DURATION = 900   # 15 minutos

# Patrones comunes de Kraken para generar pares automáticamente
KRAKEN_PAIR_PATTERNS = [
    # Patrones más comunes primero para optimizar
    "XX{asset}ZEUR",    # Patrón más común: XXBTZEUR, XXRPZEUR
    "X{asset}ZEUR",     # Segundo más común: XETHZEUR
    "{asset}EUR",       # Moderno: TRUMPEUR, PEPEEUR
    "{asset}ZEUR",      # Híbrido: Algunos assets usan Z sin X
    "{asset}/EUR",      # Formato CSV original (poco común en OHLC)
]