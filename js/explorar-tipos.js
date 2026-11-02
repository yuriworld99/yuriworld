(function () {
  const cuerpo = document.getElementById("ex-cuerpo");
  const pestanas = document.querySelector(".ex-pestanas");
  const entrada = document.getElementById("ex-q");
  if (!cuerpo || !pestanas || !entrada) return;

  if (!document.querySelector('link[href^="css/secciones.css"]')) {
    const enlace = document.createElement("link");
    enlace.rel = "stylesheet";
    enlace.href = "css/secciones.css?v=2";
    document.head.appendChild(enlace);
  }

  const TIPOS = [
    ["", "Todas"],
    ["manga", "Manga"],
    ["manhwa", "Manhwa"],
    ["manhua", "Manhua"],
    ["webtoon", "Webtoon"],
    ["novela_ligera", "Novela ligera"]
  ];
  const ORDENES = [
    ["recientes", "Más recientes"],
    ["mejor", "Mejor puntuadas"],
    ["az", "Orden A–Z"]
  ];
  const POR_PAGINA = 20;

  let tipoActivo = "";
  let generoActivo = "";
  let orden = "recientes";
  let mostrados = POR_PAGINA;
  let obrasActuales = [];
  let mapaResumen = {};
  let turno = 0;
  let programado = null;
  let envoltorio = null;

  // ---------- Barra de filtros ----------
  const caja = document.createElement("div");
  caja.hidden = true;

  const filaTipos = document.createElement("div");
  filaTipos.className = "yw-filtro-tipos";

  const filaExtra = document.createElement("div");
  filaExtra.className = "yw-filtros-extra";

  const selectGenero = document.createElement("select");
  selectGenero.className = "yw-select-chico";
  selectGenero.setAttribute("aria-label", "Filtrar por género");

  const selectOrden = document.createElement("select");
  selectOrden.className = "yw-select-chico";
  selectOrden.setAttribute("aria-label", "Ordenar");

  ORDENES.forEach(function (par) {
    const opcion = document.createElement("option");
    opcion.value = par[0];
    opcion.textContent = par[1];
    selectOrden.appendChild(opcion);
  });

  filaExtra.appendChild(selectGenero);
  filaExtra.appendChild(selectOrden);
  caja.appendChild(filaTipos);
  caja.appendChild(filaExtra);
  pestanas.insertAdjacentElement("afterend", caja);

  function llenarGeneros() {
    if (selectGenero.options.length > 0) return;

    const todos = document.createElement("option");
    todos.value = "";
    todos.textContent = "Todos los géneros";
    selectGenero.appendChild(todos);

    const lista = window.YW && window.YW.GENEROS ? window.YW.GENEROS : [];
    lista.forEach(function (genero) {
      const opcion = document.createElement("option");
      opcion.value = genero.valor;
      opcion.textContent = genero.etiqueta;
      selectGenero.appendChild(opcion);
    });
  }

  function esObras() {
    const activa = document.querySelector(".ex-pestana.activa");
    return !!activa && activa.dataset.pestana === "obras";
  }

  function quitarTildes(texto) {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  function limpiarTexto(texto) {
    return texto.replace(/[,()%*\\"]/g, " ").trim();
  }

  function pintarChips() {
    filaTipos.querySelectorAll(".yw-chip-tipo").forEach(function (chip) {
      chip.classList.toggle("activo", chip.dataset.tipo === tipoActivo);
    });
  }

  TIPOS.forEach(function (par) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "yw-chip-tipo";
    chip.dataset.tipo = par[0];
    chip.textContent = par[1];
    chip.addEventListener("click", function () {
      tipoActivo = par[0];
      pintarChips();
      cargarObras();
    });
    filaTipos.appendChild(chip);
  });

  selectGenero.addEventListener("change", function () {
    generoActivo = selectGenero.value;
    cargarObras();
  });

  selectOrden.addEventListener("change", function () {
    orden = selectOrden.value;
    mostrados = POR_PAGINA;
    pintarLista();
  });

  // ---------- Filas ----------
  function crearFila(rec, resumen) {
    const enlace = document.createElement("a");
    enlace.className = "ex-obra";
    enlace.href = "recomendacion.html?id=" + encodeURIComponent(rec.id);

    const portada = document.createElement("img");
    portada.className = "ex-portada";
    portada.src = rec.portada_url;
    portada.alt = "Portada de " + rec.titulo;
    portada.loading = "lazy";

    const info = document.createElement("div");
    info.className = "ex-info";

    const titulo = document.createElement("p");
    titulo.className = "ex-obra-titulo";
    titulo.textContent = rec.titulo;

    const autor = document.createElement("p");
    autor.className = "ex-obra-datos";
    autor.textContent = "de " + rec.autor;

    const estrellas = document.createElement("p");
    estrellas.className = "ex-obra-datos ex-estrellas";
    if (resumen) {
      estrellas.textContent =
        "★ " + resumen.promedio + " · " + resumen.cantidad +
        (resumen.cantidad === 1 ? " voto" : " votos");
    } else {
      estrellas.textContent = "☆ Sin calificaciones";
    }

    const generos = document.createElement("div");
    generos.className = "ex-generos";
    (rec.generos || []).slice(0, 3).forEach(function (genero) {
      const chip = document.createElement("span");
      chip.className = "ex-genero";
      chip.textContent = genero;
      generos.appendChild(chip);
    });

    info.appendChild(titulo);
    info.appendChild(autor);
    info.appendChild(estrellas);
    info.appendChild(generos);

    enlace.appendChild(portada);
    enlace.appendChild(info);
    return enlace;
  }

  function crearMensaje(texto) {
    const mensaje = document.createElement("p");
    mensaje.className = "ex-vacio";
    mensaje.textContent = texto;
    return mensaje;
  }

  function nuevoEnvoltorio() {
    envoltorio = document.createElement("div");
    envoltorio.dataset.ywFiltro = "1";
    return envoltorio;
  }

  function ordenar(lista) {
    const copia = lista.slice();

    if (orden === "mejor") {
      copia.sort(function (a, b) {
        const ra = mapaResumen[a.id];
        const rb = mapaResumen[b.id];
        const pa = ra ? Number(ra.promedio) : -1;
        const pb = rb ? Number(rb.promedio) : -1;
        if (pb !== pa) return pb - pa;
        const ca = ra ? ra.cantidad : 0;
        const cb = rb ? rb.cantidad : 0;
        if (cb !== ca) return cb - ca;
        return new Date(b.created_at) - new Date(a.created_at);
      });
    } else if (orden === "az") {
      copia.sort(function (a, b) {
        return a.titulo.localeCompare(b.titulo, "es", { sensitivity: "base" });
      });
    }

    return copia;
  }

  function pintarLista() {
    if (!envoltorio) return;

    const q = entrada.value.trim();
    const nodos = [];

    const titulo = document.createElement("h2");
    titulo.className = "yw-titulo-filtro";
    titulo.textContent =
      obrasActuales.length + (obrasActuales.length === 1 ? " obra" : " obras");
    nodos.push(titulo);

    if (obrasActuales.length === 0) {
      nodos.push(
        crearMensaje(
          q || tipoActivo || generoActivo
            ? "No encontramos obras con esos filtros."
            : "Todavía no hay obras."
        )
      );
    } else {
      const ordenadas = ordenar(obrasActuales);
      ordenadas.slice(0, mostrados).forEach(function (rec) {
        nodos.push(crearFila(rec, mapaResumen[rec.id]));
      });

      if (ordenadas.length > mostrados) {
        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = "ex-mas";
        boton.textContent = "Mostrar más (" + (ordenadas.length - mostrados) + " restantes)";
        boton.addEventListener("click", function () {
          mostrados += POR_PAGINA;
          pintarLista();
        });
        nodos.push(boton);
      }
    }

    envoltorio.replaceChildren.apply(envoltorio, nodos);
  }

  async function cargarObras() {
    turno += 1;
    const miTurno = turno;

    const contenedor = nuevoEnvoltorio();
    contenedor.appendChild(crearMensaje("Cargando..."));
    cuerpo.replaceChildren(contenedor);

    const q = limpiarTexto(entrada.value);

    function base() {
      let consulta = supabaseClient
        .from("recomendaciones")
        .select("id, titulo, autor, generos, portada_url, created_at")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (tipoActivo) consulta = consulta.eq("tipo", tipoActivo);
      if (generoActivo) consulta = consulta.contains("generos", [generoActivo]);
      return consulta;
    }

    let consulta = base();
    if (q) consulta = consulta.or("titulo.ilike.%" + q + "%,autor.ilike.%" + q + "%");

    const { data } = await consulta;
    const obras = data || [];

    if (q && window.YW && window.YW.GENEROS) {
      const genero = window.YW.GENEROS.find(function (item) {
        return (
          quitarTildes(item.valor) === quitarTildes(q) ||
          quitarTildes(item.etiqueta) === quitarTildes(q)
        );
      });

      if (genero) {
        const { data: porGenero } = await base().contains("generos", [genero.valor]);
        (porGenero || []).forEach(function (rec) {
          if (!obras.some(function (existente) { return existente.id === rec.id; })) {
            obras.push(rec);
          }
        });
      }
    }

    const { data: resumenes } = await supabaseClient
      .from("resumen_calificaciones")
      .select("recomendacion_id, promedio, cantidad")
      .limit(1000);

    if (miTurno !== turno) return;

    mapaResumen = {};
    (resumenes || []).forEach(function (resumen) {
      mapaResumen[resumen.recomendacion_id] = resumen;
    });

    obrasActuales = obras;
    mostrados = POR_PAGINA;
    pintarLista();
  }

  // ---------- Integración con la pantalla ----------
  function alCambiarCuerpo() {
    if (!esObras()) return;
    const primero = cuerpo.firstElementChild;
    if (primero && primero.dataset.ywFiltro === "1") return;

    clearTimeout(programado);
    programado = setTimeout(cargarObras, 150);
  }

  new MutationObserver(alCambiarCuerpo).observe(cuerpo, { childList: true });

  function actualizarBarra() {
    const visible = esObras();
    caja.hidden = !visible;

    if (visible) {
      llenarGeneros();
    } else if (tipoActivo || generoActivo) {
      tipoActivo = "";
      generoActivo = "";
      selectGenero.value = "";
      pintarChips();
    }
  }

  new MutationObserver(actualizarBarra).observe(pestanas, {
    attributes: true,
    attributeFilter: ["class"],
    subtree: true
  });

  pintarChips();
  actualizarBarra();
})();
