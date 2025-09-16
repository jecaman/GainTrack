# 📚 Sistema de Cache Histórico - Explicación Completa

## 🤔 **¿Por qué necesitamos un sistema de cache?**

### **Problema Actual:**
Cada vez que cargas tu portfolio, tu aplicación hace esto:
1. Lee tu archivo CSV con los trades
2. Ve que tienes BTC, ETH, ADA, TRUMP, etc.
3. **LLAMA A KRAKEN API** para obtener el precio actual de cada moneda
4. Espera 2-5 segundos para que Kraken responda
5. Muestra tu portfolio

**Problema:** Si 10 personas usan tu app al mismo tiempo, harás 10 llamadas a Kraken. Si cada una tarda 3 segundos, es muy lento.

---

## 💡 **¿Qué es el "Cache"?**

**Cache = Almacén temporal de datos**

Imagínate que cada vez que quieres saber el precio del Bitcoin, en lugar de llamar por teléfono a Kraken, tienes una **libreta** donde has apuntado:
- Bitcoin: 98.400€ (actualizado hoy a las 10:00)
- Ethereum: 3.800€ (actualizado hoy a las 10:00)

Cuando alguien te pregunta el precio, miras tu libreta (0.1 segundos) en lugar de llamar por teléfono (3 segundos).

**Esa libreta es el "cache".**

---

## 🏗️ **Cómo funcionará nuestro sistema:**

### **Sin Cache (Situación Actual):**
```
Usuario sube CSV → App lee trades → Llama a Kraken → Espera 3s → Muestra portfolio
       ↑                             ↑                    ↑
   Cada vez                      Cada vez              Lento
```

### **Con Cache (Nuevo Sistema):**
```
Usuario sube CSV → App lee trades → Mira en Base de Datos → Muestra portfolio
       ↑                             ↑                     ↑
   Cada vez                     0.1 segundos            Rápido
```

---

## 🗄️ **¿Dónde guardamos el cache? - Supabase**

**Supabase = Base de datos PostgreSQL en la nube (gratis)**

### **¿Por qué en la nube y no en tu ordenador?**

**Opción A: Base de datos local (en tu PC)**
- ✅ Gratis
- ❌ Solo funciona en tu ordenador
- ❌ Si subes la app a internet, no funciona
- ❌ Si cambias de PC, pierdes los datos

**Opción B: Base de datos en la nube (Supabase)**
- ✅ Gratis (hasta 500MB)
- ✅ Funciona desde cualquier ordenador
- ✅ Funciona cuando subas la app a internet
- ✅ Todos los usuarios comparten los mismos datos (eficiente)
- ✅ Backup automático

---

## 📊 **Estructura de la Base de Datos**

Tendremos una tabla muy simple:

```
Tabla: precios_historicos
┌────────────┬────────────┬────────────┬────────────┐
│   asset    │   precio   │   fecha    │    hora    │
├────────────┼────────────┼────────────┼────────────┤
│    BTC     │   98400.1  │ 2025-01-20 │   10:00    │
│    ETH     │   3800.93  │ 2025-01-20 │   10:00    │
│    ADA     │   0.743    │ 2025-01-20 │   10:00    │
│   TRUMP    │   41.50    │ 2025-01-20 │   10:00    │
│    BTC     │   97200.5  │ 2025-01-19 │   15:30    │
│    ETH     │   3750.20  │ 2025-01-19 │   15:30    │
└────────────┴────────────┴────────────┴────────────┘
```

**¿Qué datos guardamos?**
- **asset:** Nombre de la moneda (BTC, ETH, etc.)
- **precio:** Precio en euros
- **fecha:** Qué día
- **hora:** Qué momento del día

---

## ⚡ **Funcionamiento del Sistema**

### **Paso 1: Primera vez del día**
```
10:00 AM - Usuario usa la app por primera vez hoy
│
├── App: "¿Tengo precios de hoy en la base de datos?"
├── Supabase: "No, no tienes precios de hoy"
├── App: "Llamar a Kraken para obtener precios actuales"
├── Kraken: "BTC=98400€, ETH=3800€..." (tarda 3 segundos)
├── App: "Guardar estos precios en Supabase para hoy"
├── Supabase: "Datos guardados ✅"
└── Usuario: Ve su portfolio (tardó 3 segundos)
```

### **Paso 2: Resto del día**
```
10:30 AM - Otro usuario usa la app
│
├── App: "¿Tengo precios de hoy en la base de datos?"
├── Supabase: "Sí, aquí tienes: BTC=98400€, ETH=3800€..." (0.1 segundos)
└── Usuario: Ve su portfolio (tardó 0.1 segundos) 🚀
```

### **Paso 3: Al día siguiente**
```
10:00 AM siguiente día - Usuario usa la app
│
├── App: "¿Tengo precios de HOY en la base de datos?"
├── Supabase: "No, solo tengo de ayer"
├── App: "Llamar a Kraken para precios actualizados"
├── (Se repite el Paso 1)
```

---

## 🎯 **Beneficios del Sistema**

### **Velocidad:**
- **Sin cache:** 3-5 segundos cada vez
- **Con cache:** 0.1 segundos después de la primera vez

### **Costes:**
- **Sin cache:** Llamadas ilimitadas a Kraken (pueden limitarte)
- **Con cache:** 1 llamada por día por moneda

### **Escalabilidad:**
- **Sin cache:** Si 100 usuarios usan la app = 100 llamadas a Kraken
- **Con cache:** Si 100 usuarios usan la app = 1 llamada a Kraken, 99 desde cache

### **Fiabilidad:**
- **Sin cache:** Si Kraken está lento, tu app está lenta
- **Con cache:** Si Kraken está lento, solo afecta a la primera actualización del día

---

## 🛠️ **Implementación Técnica**

### **Componentes:**
1. **Supabase:** Base de datos en la nube (gratis)
2. **Código nuevo:** Función que mira en la BD antes de llamar a Kraken
3. **Lógica de actualización:** Solo llamar a Kraken si no tenemos datos frescos

### **Modificaciones en tu código:**
- Antes: `precios = llamar_a_kraken()`
- Después: `precios = buscar_en_cache() o llamar_a_kraken_y_guardar()`

---

## 📈 **¿Cuánto cuesta y cuánto dura?**

### **Supabase Free Tier:**
- **Almacenamiento:** 500MB gratis
- **Nuestros datos:** ~3MB por año
- **Duración:** Más de 100 años gratis

### **Ejemplo real:**
- 100 monedas diferentes
- Actualizamos precios 1 vez al día
- 365 días al año
- = 36,500 registros/año = ~3MB

**Conclusión: Es prácticamente gratis para siempre**

---

## 🚀 **Próximos Pasos**

1. ✅ **Crear cuenta en Supabase** (2 minutos)
2. ✅ **Crear proyecto y tabla** (3 minutos)
3. ✅ **Obtener URL de conexión** (1 minuto)
4. ✅ **Modificar código para usar la BD** (15 minutos)
5. ✅ **Probar que funciona** (5 minutos)

**Total: 26 minutos para una mejora dramática de rendimiento**

---

## ❓ **Preguntas Frecuentes**

**P: ¿Y si Supabase se cae?**
R: El código tiene fallback - si no puede conectar a la BD, usa la API de Kraken directamente (como ahora).

**P: ¿Los precios estarán actualizados?**
R: Se actualizan automáticamente una vez al día. Para trading de alta frecuencia no sirve, pero para ver el portfolio es perfecto.

**P: ¿Qué pasa si quiero precios más frecuentes?**
R: Podemos configurar actualizaciones cada hora en lugar de diarias.

**P: ¿Funcionará cuando suba la app a internet?**
R: Sí, Supabase funciona igual desde local, desde un servidor web, desde cualquier sitio.

---

## 🎉 **Resumen Simple**

**Antes:** Cada usuario llama a Kraken → Lento  
**Después:** Primer usuario llama a Kraken y guarda en BD → Resto usan la BD → Rápido

**Es como tener un asistente que apunta los precios en una libreta compartida para que todos los usuarios lean de ahí en lugar de llamar por teléfono cada vez.**