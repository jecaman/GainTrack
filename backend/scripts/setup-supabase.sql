-- Tabla simple para cache de precios
CREATE TABLE precios_cache (
    asset VARCHAR(10) PRIMARY KEY,
    precio_eur DECIMAL(15,8) NOT NULL,
    fecha DATE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_timestamp
    BEFORE UPDATE ON precios_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- Índice en fecha para consultas rápidas
CREATE INDEX idx_precios_fecha ON precios_cache(fecha);

-- Permitir acceso público
ALTER TABLE precios_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acceso publico" ON precios_cache FOR ALL USING (true);

-- Datos de prueba
INSERT INTO precios_cache (asset, precio_eur, fecha) VALUES 
    ('XXBT', 95000.00, CURRENT_DATE),
    ('XETH', 3500.00, CURRENT_DATE),
    ('ADA', 0.85, CURRENT_DATE)
ON CONFLICT (asset) DO UPDATE SET 
    precio_eur = EXCLUDED.precio_eur,
    fecha = EXCLUDED.fecha;