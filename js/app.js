/* =====================================================
   app.js - Lógica de la página
   Todo acceso a datos pasa por el objeto "api" (js/api-simulada.js).
   Hoy ese objeto simula la hoja de cálculo; con una conexión real a
   Google Sheets solo habría que reemplazar ese archivo.
===================================================== */

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio",
               "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

let todosLosGastos = [];  // filas de la hoja "Gastos": [id, fecha, hora, artículo, categoría, precio, persona]
let capitalActual = 0;    // capital del período elegido en el resumen

/* ---------- Utilidades ---------- */
const $ = id => document.getElementById(id);
const dinero = n => "$ " + n.toLocaleString("es-AR", { maximumFractionDigits: 2 });
const mostrarError = prefijo => e => alert(prefijo + ((e && e.message) || e));

// "dd/MM/yyyy" -> "yyyy-MM-dd" (formato que usan los <input type="date">)
function fechaISO(f) {
  const p = String(f).split("/");
  return p[2] + "-" + p[1] + "-" + p[0];
}

// ¿El gasto pertenece al mes (1-12) y año indicados?
function delPeriodo(gasto, mes, anio) {
  const p = String(gasto[1]).trim().split("/");
  return p.length === 3 && Number(p[1]) === Number(mes) && String(p[2]) === String(anio);
}

/* ---------- Inicio ---------- */
function init() {
  // Cargar los meses en los dos selects
  MESES.forEach(function (m, i) {
    $("mesCapital").add(new Option(m, m));
    $("mesResumen").add(new Option(m, i + 1));
  });
  // El resumen arranca en el mes y año actuales
  const hoy = new Date();
  $("mesResumen").value = hoy.getMonth() + 1;
  $("anioResumen").value = hoy.getFullYear();

  cargarGastos();
}
window.addEventListener("DOMContentLoaded", init);

/* ---------- Gastos: guardar ---------- */
function guardarGasto() {
  const articulo = $("articulo").value.trim();
  const categoria = $("categoria").value.trim();
  const persona = $("persona").value.trim();
  const precio = Number($("precio").value);

  if (articulo === "") return alert("⚠️ Tenés que ingresar un artículo.");
  if ($("precio").value === "") return alert("⚠️ Tenés que ingresar un precio.");
  if (isNaN(precio) || precio <= 0) return alert("⚠️ El precio debe ser mayor que 0.");

  api.guardarGasto(articulo, categoria, precio, persona)
    .then(function () {
      alert("Gasto guardado correctamente");
      ["articulo", "categoria", "precio", "persona"].forEach(id => $(id).value = "");
      cargarGastos();
    })
    .catch(mostrarError("Error: "));
}

/* ---------- Gastos: cargar y mostrar ---------- */
function cargarGastos() {
  api.obtenerGastos()
    .then(function (gastos) {
      todosLosGastos = gastos;
      cargarCapital();       // calcula también el resumen del período
      dibujarTabla(gastos);
    })
    .catch(mostrarError("Error al cargar los gastos: "));
}

// Dibuja la tabla con la lista recibida (todos los gastos o los filtrados)
function dibujarTabla(lista) {
  const cuerpo = $("cuerpoTabla");
  cuerpo.innerHTML = "";

  lista.forEach(function (gasto) {
    const fila = document.createElement("tr");

    gasto.forEach(function (dato) {
      const celda = document.createElement("td");
      celda.textContent = dato;
      fila.appendChild(celda);
    });

    // Última celda: botones de editar y eliminar
    const acciones = document.createElement("td");
    acciones.appendChild(crearBoton("✏️", "Editar", () => editarGastoDesdePagina(gasto)));
    acciones.appendChild(crearBoton("🗑️", "Eliminar", () => eliminarGastoDesdePagina(gasto[0])));
    fila.appendChild(acciones);

    cuerpo.appendChild(fila);
  });
}

function crearBoton(texto, titulo, alHacerClic) {
  const b = document.createElement("button");
  b.textContent = texto;
  b.title = titulo;
  b.onclick = alHacerClic;
  return b;
}

/* ---------- Gastos: buscar y filtrar ---------- */
function filtrarGastos() {
  const texto = $("buscador").value.toLowerCase().trim();
  const desde = $("fechaDesde").value;
  const hasta = $("fechaHasta").value;

  const filtrados = todosLosGastos.filter(function (gasto) {
    // 1) El texto debe aparecer en alguna columna (ID, fecha, artículo, etc.)
    if (!gasto.some(d => String(d).toLowerCase().includes(texto))) return false;
    // 2) La fecha debe estar dentro del rango elegido
    const f = fechaISO(gasto[1]);
    if (desde !== "" && f < desde) return false;
    if (hasta !== "" && f > hasta) return false;
    return true;
  });

  calcularResumen(filtrados);
  dibujarTabla(filtrados);
}

/* ---------- Gastos: eliminar y editar ---------- */
function eliminarGastoDesdePagina(id) {
  if (!confirm("¿Estás seguro de que querés eliminar este gasto?")) return;

  api.eliminarGasto(id)
    .then(function () { alert("Gasto eliminado correctamente"); cargarGastos(); })
    .catch(mostrarError("Error al eliminar el gasto: "));
}

// Pide los datos nuevos con ventanas emergentes (cancelar en cualquiera aborta la edición)
function editarGastoDesdePagina(gasto) {
  const articulo = prompt("Artículo:", gasto[3]);
  if (articulo === null) return;
  if (articulo.trim() === "") return alert("⚠️ El artículo no puede quedar vacío.");

  const categoria = prompt("Categoría:", gasto[4]);
  if (categoria === null) return;

  const precio = prompt("Precio:", gasto[5]);
  if (precio === null) return;
  const precioNumero = Number(precio);
  if (isNaN(precioNumero) || precioNumero <= 0) return alert("⚠️ El precio debe ser mayor que 0.");

  const persona = prompt("Persona que compró:", gasto[6]);
  if (persona === null) return;

  api.editarGasto(gasto[0], articulo.trim(), categoria.trim(), precioNumero, persona.trim())
    .then(function () { alert("Gasto actualizado correctamente"); cargarGastos(); })
    .catch(mostrarError("Error al editar el gasto: "));
}

/* ---------- Capital ---------- */
function guardarCapitalDesdePagina() {
  const mes = $("mesCapital").value;
  const anio = $("anioCapital").value;
  const capital = Number($("capitalDisponible").value);

  if (mes === "") return alert("⚠️ Tenés que seleccionar un mes.");
  if (anio === "") return alert("⚠️ Tenés que ingresar el año.");
  if ($("capitalDisponible").value === "") return alert("⚠️ Tenés que ingresar el capital.");
  if (isNaN(capital) || capital <= 0) return alert("⚠️ El capital debe ser mayor que 0.");

  api.guardarCapital(mes, Number(anio), capital)
    .then(function () {
      alert("Capital guardado correctamente");
      ["mesCapital", "anioCapital", "capitalDisponible"].forEach(id => $(id).value = "");
      cargarCapital();  // refresca el resumen por si se cargó el período visible
    })
    .catch(mostrarError("Error al guardar el capital: "));
}

// Busca el capital del período elegido y actualiza el resumen
function cargarCapital() {
  api.obtenerCapital()
    .then(function (capitales) {
      const mes = MESES[Number($("mesResumen").value) - 1];
      const anio = String($("anioResumen").value);

      capitalActual = 0;
      capitales.forEach(function (c) {  // c = [id, mes, año, capital]
        if (String(c[1]).trim().toLowerCase() === mes.toLowerCase() && String(c[2]).trim() === anio) {
          capitalActual = Number(c[3]) || 0;
        }
      });

      $("capitalDisponibleResumen").textContent = dinero(capitalActual);
      actualizarResumenPeriodo();
    })
    .catch(mostrarError("Error al cargar el capital: "));
}

/* ---------- Resumen del período ---------- */
function cambiarPeriodo() { cargarCapital(); }

function actualizarResumenPeriodo() {
  const mes = $("mesResumen").value;
  const anio = $("anioResumen").value;
  calcularResumen(todosLosGastos.filter(g => delPeriodo(g, mes, anio)));
}

// Calcula y muestra total, saldo, cantidad y promedio de la lista recibida
function calcularResumen(gastos) {
  const total = gastos.reduce((suma, g) => suma + (Number(g[5]) || 0), 0);
  const cantidad = gastos.length;

  $("totalGastado").textContent = dinero(total);
  $("saldoRestante").textContent = dinero(capitalActual - total);
  $("cantidadGastos").textContent = cantidad;
  $("promedioGasto").textContent = dinero(cantidad ? total / cantidad : 0);
}

/* ---------- Exportar a Excel (se genera en el navegador con SheetJS) ---------- */
function generarExcel() {
  const boton = document.querySelector(".boton-excel");
  const mes = $("mesResumen").value;
  const anio = $("anioResumen").value;
  const nombreMes = MESES[Number(mes) - 1];

  if (!nombreMes || !anio) return alert("⚠️ Seleccioná un mes y un año antes de generar el Excel.");
  if (typeof XLSX === "undefined") return alert("⚠️ No se pudo cargar el generador de Excel. Verificá tu conexión a Internet.");

  const gastos = todosLosGastos.filter(g => delPeriodo(g, mes, anio));
  const total = gastos.reduce((suma, g) => suma + (Number(g[5]) || 0), 0);

  try {
    boton.disabled = true;
    boton.textContent = "⏳ Generando Excel...";

    // Filas: encabezados + gastos + bloque de resumen
    const filas = [["ID", "Fecha", "Hora", "Artículo", "Categoría", "Precio", "Persona"]];
    gastos.forEach(g => filas.push([g[0], g[1], g[2], g[3], g[4], Number(g[5]) || 0, g[6]]));
    filas.push([], ["RESUMEN"],
      ["Mes", nombreMes],
      ["Año", anio],
      ["Capital disponible", capitalActual],
      ["Total gastado", total],
      ["Saldo restante", capitalActual - total],
      ["Cantidad de gastos", gastos.length],
      ["Promedio por gasto", gastos.length ? total / gastos.length : 0]);

    const hoja = XLSX.utils.aoa_to_sheet(filas);
    hoja["!cols"] = [14, 13, 10, 28, 22, 16, 24].map(w => ({ wch: w }));  // ancho de columnas

    // Formato de dinero en la columna Precio (F)
    for (let i = 2; i <= gastos.length + 1; i++) {
      if (hoja["F" + i]) { hoja["F" + i].t = "n"; hoja["F" + i].z = "$ #,##0.00"; }
    }

    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Gastos " + nombreMes);
    XLSX.writeFile(libro, "Gastos_" + nombreMes + "_" + anio + ".xlsx");  // descarga directa

  } catch (error) {
    console.error(error);
    alert("Error al generar el Excel: " + (error.message || error));
  } finally {
    boton.disabled = false;
    boton.textContent = "📊 Generar Excel";
  }
}

/* ---------- Demo ---------- */
// Borra lo cargado y vuelve a los datos de ejemplo
function reiniciarDemo() {
  if (!confirm("¿Restablecer los datos de ejemplo? Se borrará lo que cargaste.")) return;
  api.reiniciar();
  cargarGastos();
}
