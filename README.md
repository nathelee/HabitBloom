# HabitBloom

Aplicación web responsive para crear hábitos diarios, marcar completados, mantener rachas y ver un historial compacto de 7 días. Los datos persisten en el navegador con `localStorage`.

## Funcionalidades

- Crear hábitos con nombre (máx. 40 caracteres) y fecha de inicio personalizada.
- Marcar si el hábito se completó hoy con un toggle animado.
- Rachas automáticas basadas en días consecutivos desde la fecha de inicio.
- Historial compacto de los últimos 7 días con pills.
- Estadísticas semanales con porcentaje de cumplimiento y barra de progreso.
- Edición de la fecha de inicio por hábito.
- Eliminación con confirmación y toasts motivacionales.

## Tecnologías

- HTML, CSS y JavaScript (vanilla)
- Persistencia local con `localStorage`

## Ejecutar en local

No requiere build ni dependencias externas.

```bash
# Opción 1: abrir directamente
open index.html

# Opción 2: servidor local simple
python3 -m http.server
# luego abrir http://localhost:8000
```

## Uso rápido

1. Escribe el nombre del hábito.
2. Selecciona la **Start date** (por defecto hoy).
3. Pulsa **Add habit**.
4. Marca **Done today** para registrar la actividad.
5. Ajusta la fecha de inicio en cada tarjeta si necesitas moverla.

## Reglas clave

### Fecha de inicio
- Se guarda como `startDate` (YYYY-MM-DD) por hábito.
- Si la fecha de inicio es futura, el toggle queda deshabilitado y la racha es 0.
- Los días anteriores a la fecha de inicio aparecen como **N/A** en el historial.

### Rachas
- La racha es el conteo de días consecutivos completados hasta hoy.
- Solo se consideran días **>= startDate**.
- Si hoy no está completado, la racha se basa en la última secuencia terminada ayer.

### Estadísticas semanales
- Ventana móvil de 7 días (incluye hoy).
- `totalPossible` solo cuenta días elegibles (>= startDate).
- Porcentaje = `completed / totalPossible` (si no hay días elegibles, muestra 0%).

## Estructura del proyecto

```
.
├── index.html
├── styles.css
├── app.js
└── AGENTS.md
```

## Persistencia

Los datos se guardan en `localStorage` bajo la clave:

```
habitbloom:data:v1
```

El modelo de datos principal:

```js
Habit = {
  id: string,
  name: string,
  createdAt: number,
  startDate: "YYYY-MM-DD",
  firstCompletedAt: "YYYY-MM-DD" | null
}

completions[habitId]["YYYY-MM-DD"] = true
```

## Personalización rápida

- Colores: modifica variables CSS en `styles.css` dentro de `:root`.
- Tipografía: cambia el enlace de Google Fonts en `index.html`.
- Textos: ajusta microcopy y mensajes motivacionales en `app.js`.

## Notas

- No hay tests automatizados por ahora.
- El proyecto está pensado para uso offline en un solo navegador.

---

Si necesitas un despliegue (Vercel/Netlify) o agregar tests, puedo ayudarte.
