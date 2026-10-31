(function () {
  const panel = document.getElementById("panel-recomendacion");
  const botonPublicar = document.getElementById("boton-publicar");
  const mensaje = document.getElementById("mensaje-compositor");
  if (!panel || !botonPublicar || !window.YW) return;

  if (!document.querySelector('link[href^="css/insignias.css"]')) {
    const enlace = document.createElement("link");
    enlace.rel = "stylesheet";
    enlace.href = "css/insignias.css?v=1";
    document.head.appendChild(enlace);
  }

  const contenedorGeneros = panel.querySelector(".generos");
  if (contenedorGeneros) {
    contenedorGeneros.replaceChildren();
    window.YW.llenarGeneros(contenedorGeneros);
  }

  const bloque = document.createElement("div");
  bloque.className = "yw-extra";

  const etiquetaTipo = document.createElement("label");
  etiquetaTipo.setAttribute("for", "rec-tipo");
  etiquetaTipo.textContent = "Tipo de obra";
  const selectTipo = document.createElement("select");
  selectTipo.id = "rec-tipo";
  selectTipo.className = "yw-select";
  window.YW.llenarSelect(selectTipo, window.YW.TIPOS);

  const etiquetaEstado = document.createElement("label");
  etiquetaEstado.setAttribute("for", "rec-estado");
  etiquetaEstado.textContent = "Estado";
  const selectEstado = document.createElement("select");
  selectEstado.id = "rec-estado";
  selectEstado.className = "yw-select";
  window.YW.llenarSelect(selectEstado, window.YW.ESTADOS);

  const etiqueta18 = document.createElement("label");
  etiqueta18.className = "yw-18";
  const casilla18 = document.createElement("input");
  casilla18.type = "checkbox";
  casilla18.id = "rec-18";
  casilla18.style.width = "auto";
  casilla18.style.marginTop = "3px";
  const texto18 = document.createElement("span");
  texto18.textContent = "Es una obra +18 (contenido para mayores de 18 años)";
  etiqueta18.appendChild(casilla18);
  etiqueta18.appendChild(texto18);

  bloque.appendChild(etiquetaTipo);
  bloque.appendChild(selectTipo);
  bloque.appendChild(etiquetaEstado);
  bloque.appendChild(selectEstado);
  bloque.appendChild(etiqueta18);

  const etiquetaPortada = panel.querySelector('label[for="rec-portada"]');
  if (etiquetaPortada && etiquetaPortada.parentNode === panel) {
    panel.insertBefore(bloque, etiquetaPortada);
  } else {
    panel.appendChild(bloque);
  }

  const desdeOriginal = supabaseClient.from.bind(supabaseClient);
  supabaseClient.from = function (tabla) {
    const consulta = desdeOriginal(tabla);

    if (tabla === "recomendaciones") {
      const insertarOriginal = consulta.insert.bind(consulta);
      consulta.insert = function (datos, opciones) {
        if (datos && !Array.isArray(datos) && datos.titulo) {
          datos.tipo = selectTipo.value || null;
          datos.estado = selectEstado.value || null;
          datos.es_18 = casilla18.checked;
        }
        return insertarOriginal(datos, opciones);
      };
    }

    return consulta;
  };

  botonPublicar.addEventListener(
    "click",
    function (evento) {
      if (panel.hidden) return;
      if (!selectTipo.value || !selectEstado.value) {
        evento.stopImmediatePropagation();
        evento.preventDefault();
        mensaje.textContent = "Elegí el tipo de obra y el estado (en emisión o finalizado).";
        mensaje.className = "muro-mensaje error";
      }
    },
    true
  );

  new MutationObserver(function () {
    if (panel.hidden) {
      selectTipo.value = "";
      selectEstado.value = "";
      casilla18.checked = false;
    }
  }).observe(panel, { attributes: true, attributeFilter: ["hidden"] });
})();
