(function () {
  const panel = document.getElementById("panel-recomendacion");
  const botonPublicar = document.getElementById("boton-publicar");
  const mensaje = document.getElementById("mensaje-compositor");
  if (!panel || !botonPublicar || !window.YW) return;

  if (!document.querySelector('link[href^="css/insignias.css"]')) {
    const enlace = document.createElement("link");
    enlace.rel = "stylesheet";
    enlace.href = "css/insignias.css?v=6";
    document.head.appendChild(enlace);
  }

  const contenedorGeneros = panel.querySelector(".generos");
  if (contenedorGeneros) {
    contenedorGeneros.replaceChildren();
    window.YW.llenarGeneros(contenedorGeneros);
  }

  // ---------- Campo "Otros títulos" (antes de la sinopsis) ----------
  const etiquetaOtros = document.createElement("label");
  etiquetaOtros.setAttribute("for", "rec-otros");
  etiquetaOtros.textContent = "Otros títulos (opcional, uno por línea)";
  const campoOtros = document.createElement("textarea");
  campoOtros.id = "rec-otros";
  campoOtros.maxLength = 1500;
  campoOtros.style.minHeight = "80px";

  const etiquetaSinopsis = panel.querySelector('label[for="rec-sinopsis"]');
  if (etiquetaSinopsis && etiquetaSinopsis.parentNode === panel) {
    panel.insertBefore(etiquetaOtros, etiquetaSinopsis);
    panel.insertBefore(campoOtros, etiquetaSinopsis);
  } else {
    panel.appendChild(etiquetaOtros);
    panel.appendChild(campoOtros);
  }

  // ---------- Tipo y estado (solo Lecturas) y +18 (antes de la portada) ----------
  const bloque = document.createElement("div");
  bloque.className = "yw-extra";

  const bloqueLectura = document.createElement("div");

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

  bloqueLectura.appendChild(etiquetaTipo);
  bloqueLectura.appendChild(selectTipo);
  bloqueLectura.appendChild(etiquetaEstado);
  bloqueLectura.appendChild(selectEstado);

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

  bloque.appendChild(bloqueLectura);
  bloque.appendChild(etiqueta18);

  const etiquetaPortada = panel.querySelector('label[for="rec-portada"]');
  if (etiquetaPortada && etiquetaPortada.parentNode === panel) {
    panel.insertBefore(bloque, etiquetaPortada);
  } else {
    panel.appendChild(bloque);
  }

  // ---------- Buscador de obras (arriba del panel) ----------
  let buscador = null;
  let cajaBuscador = null;
  if (window.YW.anilist) {
    cajaBuscador = document.createElement("div");
    panel.insertBefore(cajaBuscador, panel.firstElementChild);

    buscador = window.YW.anilist.montar({
      contenedor: cajaBuscador,
      alElegir: function (obra) {
        window.YW.anilist.rellenar(
          obra,
          {
            titulo: document.getElementById("rec-titulo"),
            autor: document.getElementById("rec-autor"),
            otros: campoOtros,
            tipo: selectTipo,
            estado: selectEstado,
            es18: casilla18
          },
          true
        );
      }
    });
  }

  // ---------- Sección (arriba de todo) ----------
  const cajaSeccion = document.createElement("div");

  const etiquetaSeccion = document.createElement("label");
  etiquetaSeccion.setAttribute("for", "rec-seccion");
  etiquetaSeccion.textContent = "Sección";

  const selectSeccion = document.createElement("select");
  selectSeccion.id = "rec-seccion";
  selectSeccion.className = "yw-select";
  Object.keys(window.YW.SECCIONES).forEach(function (clave) {
    const opcion = document.createElement("option");
    opcion.value = clave;
    opcion.textContent = window.YW.SECCIONES[clave].opcion || window.YW.SECCIONES[clave].etiqueta;
    selectSeccion.appendChild(opcion);
  });

  const avisoSeccion = document.createElement("p");
  avisoSeccion.className = "aviso-seccion";
  avisoSeccion.hidden = true;

  cajaSeccion.appendChild(etiquetaSeccion);
  cajaSeccion.appendChild(selectSeccion);
  cajaSeccion.appendChild(avisoSeccion);
  panel.insertBefore(cajaSeccion, panel.firstElementChild);

  const interfazSeccion = {
    etiquetaAutor: panel.querySelector('label[for="rec-autor"]'),
    etiquetaSinopsis: panel.querySelector('label[for="rec-sinopsis"]'),
    camposLectura: bloqueLectura,
    selectTipo: selectTipo,
    selectEstado: selectEstado,
    buscador: cajaBuscador,
    aviso: avisoSeccion
  };

  function aplicarSeccion() {
    const conf = window.YW.aplicarSeccion(selectSeccion.value, interfazSeccion);
    if (!conf.anilist && buscador) buscador.vincular(null);
    return conf;
  }

  selectSeccion.addEventListener("change", aplicarSeccion);
  aplicarSeccion();

  // ---------- Datos extra al guardar ----------
  const desdeOriginal = supabaseClient.from.bind(supabaseClient);
  supabaseClient.from = function (tabla) {
    const consulta = desdeOriginal(tabla);

    if (tabla === "recomendaciones") {
      const insertarOriginal = consulta.insert.bind(consulta);
      consulta.insert = function (datos, opciones) {
        if (datos && !Array.isArray(datos) && datos.titulo) {
          const seccion = selectSeccion.value;
          const conf = window.YW.SECCIONES[seccion] || window.YW.SECCIONES.lecturas;

          datos.seccion = seccion;
          datos.tipo = conf.conTipo ? selectTipo.value || null : conf.tipo;
          datos.estado = conf.conTipo ? selectEstado.value || null : null;
          datos.es_18 = casilla18.checked;

          const vinculada = buscador && conf.anilist ? buscador.vinculada() : null;
          datos.anilist_id = vinculada ? vinculada.anilistId : null;
          datos.titulos_alternativos = window.YW.anilist
            ? window.YW.anilist.parsearOtros(campoOtros.value)
            : [];
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
      const conf = window.YW.SECCIONES[selectSeccion.value] || window.YW.SECCIONES.lecturas;
      if (conf.conTipo && (!selectTipo.value || !selectEstado.value)) {
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
      selectSeccion.value = "lecturas";
      selectTipo.value = "";
      selectEstado.value = "";
      casilla18.checked = false;
      campoOtros.value = "";
      if (buscador) buscador.vincular(null);
      aplicarSeccion();
    }
  }).observe(panel, { attributes: true, attributeFilter: ["hidden"] });
})();
    
