# Administración de Gastos (demo de frontend)

Interfaz web para registrar y controlar los gastos de un negocio. Esta versión es **solo frontend**: simula la conexión con una hoja de cálculo guardando los datos en el navegador (`localStorage`). En la versión original, los mismos datos se guardaban en Google Sheets.

**Funciones:** alta, edición y borrado de gastos · buscador y filtro por fechas · capital por mes · resumen (total gastado, saldo, promedio) · exportación a Excel · diseño adaptable a celular.

## Estructura

```
├── index.html
├── css/estilos.css
└── js/
    ├── app.js            Lógica de la página
    └── api-simulada.js   Simula la hoja de cálculo (Gastos y Capital)
```

`app.js` nunca guarda datos por sí mismo: siempre pasa por el objeto `api`. Para conectar una hoja real, solo habría que reemplazar `api-simulada.js` por otro archivo con los mismos métodos (`obtenerGastos`, `guardarGasto`, `editarGasto`, `eliminarGasto`, `obtenerCapital`, `guardarCapital`).

## Probarlo en tu computadora
Abrí `index.html` con doble clic, o en VS Code con la extensión *Live Server*.

## Publicarlo con GitHub Pages
1. Subí la carpeta a un repositorio de GitHub.
2. En el repo: **Settings → Pages**.
3. *Source:* `Deploy from a branch` · *Branch:* `main` · carpeta `/ (root)` → **Save**.
4. En 1-2 minutos queda en `https://TU_USUARIO.github.io/NOMBRE_DEL_REPO/`.
