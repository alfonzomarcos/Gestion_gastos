/* =====================================================
   api-simulada.js - Simula la hoja de cálculo de Google Sheets
   Guarda los datos en el localStorage del navegador y devuelve Promesas,
   como lo haría una llamada real a un servidor.

   Equivalencia con la versión real (Google Sheets):
     localStorage "gastosDemo"  ->  hoja "Gastos":  ID | Fecha | Hora | Artículo | Categoría | Precio | Persona
     localStorage "capitalDemo" ->  hoja "Capital": ID | Mes | Año | Capital
     cada método de abajo       ->  una lectura/escritura sobre esas hojas
===================================================== */
const api = (function () {
  const K_GASTOS = "gastosDemo";
  const K_CAPITAL = "capitalDemo";

  const pad = (n, largo = 2) => String(n).padStart(largo, "0");
  const leer = k => JSON.parse(localStorage.getItem(k) || "[]");
  const guardar = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  // Próximo ID: toma el número más alto existente (ej. "G-000003") y suma 1
  function siguienteId(filas, prefijo) {
    const mayor = Math.max(0, ...filas.map(f => parseInt(String(f[0]).slice(2), 10) || 0));
    return prefijo + pad(mayor + 1, 6);
  }

  // Carga los datos de ejemplo (primera vez que se abre la demo o al restablecer)
  function cargarEjemplos() {
    const d = new Date();
    const f = dia => pad(dia) + "/" + pad(d.getMonth() + 1) + "/" + d.getFullYear();
    const nombre = d.toLocaleString("es-AR", { month: "long" });
    guardar(K_GASTOS, [
      ["G-000001", f(1), "09:15:00", "Martillo", "Ferretería", "8500", "Carlos"],
      ["G-000002", f(2), "11:40:00", "Resma de papel", "Librería", "6200", "Lucía"],
      ["G-000003", f(3), "16:05:00", "Café para la oficina", "Almacén", "4800", "Carlos"]
    ]);
    guardar(K_CAPITAL, [["C-000001", nombre[0].toUpperCase() + nombre.slice(1), String(d.getFullYear()), "500000"]]);
  }
  if (!localStorage.getItem(K_GASTOS)) cargarEjemplos();

  return {
    reiniciar: cargarEjemplos,

    obtenerGastos: () => Promise.resolve(leer(K_GASTOS)),
    obtenerCapital: () => Promise.resolve(leer(K_CAPITAL)),

    guardarGasto(articulo, categoria, precio, persona) {
      const filas = leer(K_GASTOS);
      const d = new Date();
      filas.push([
        siguienteId(filas, "G-"),
        pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + "/" + d.getFullYear(),
        pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds()),
        articulo, categoria, String(precio), persona
      ]);
      guardar(K_GASTOS, filas);
      return Promise.resolve();
    },

    editarGasto(id, articulo, categoria, precio, persona) {
      const filas = leer(K_GASTOS);
      const fila = filas.find(f => f[0] === id);
      if (!fila) return Promise.reject(new Error("No se encontró el gasto con ID: " + id));
      fila.splice(3, 4, articulo, categoria, String(precio), persona);
      guardar(K_GASTOS, filas);
      return Promise.resolve();
    },

    eliminarGasto(id) {
      const filas = leer(K_GASTOS);
      if (!filas.some(f => f[0] === id)) return Promise.reject(new Error("No se encontró el gasto con ID: " + id));
      guardar(K_GASTOS, filas.filter(f => f[0] !== id));
      return Promise.resolve();
    },

    guardarCapital(mes, anio, capital) {
      const filas = leer(K_CAPITAL);
      filas.push([siguienteId(filas, "C-"), mes, String(anio), String(capital)]);
      guardar(K_CAPITAL, filas);
      return Promise.resolve();
    }
  };
})();
