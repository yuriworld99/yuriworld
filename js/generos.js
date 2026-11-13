window.YW = window.YW || {};

window.YW.GENEROS = [
  { valor: "Romance", etiqueta: "Romance" },
  { valor: "Drama", etiqueta: "Drama" },
  { valor: "Comedia", etiqueta: "Comedia" },
  { valor: "Romance y comedia (RomCom)", etiqueta: "Romance y comedia (RomCom)" },
  { valor: "Drama romántico", etiqueta: "Drama romántico" },
  { valor: "Slice of life", etiqueta: "Vida cotidiana (Slice of Life)" },
  { valor: "Escolar", etiqueta: "Escolar" },
  { valor: "Psicológico", etiqueta: "Psicológico" },
  { valor: "Fantasía", etiqueta: "Fantasía" },
  { valor: "Fantasía oscura", etiqueta: "Fantasía oscura" },
  { valor: "Ciencia ficción", etiqueta: "Ciencia ficción" },
  { valor: "Misterio", etiqueta: "Misterio" },
  { valor: "Suspenso", etiqueta: "Suspenso" },
  { valor: "Terror", etiqueta: "Terror" },
  { valor: "Sobrenatural", etiqueta: "Sobrenatural" },
  { valor: "Acción", etiqueta: "Acción" },
  { valor: "Aventura", etiqueta: "Aventura" },
  { valor: "Histórico", etiqueta: "Histórico" },
  { valor: "Tragedia", etiqueta: "Tragedia" },
  { valor: "Musical", etiqueta: "Musical" },
  { valor: "Deporte", etiqueta: "Deporte" },
  { valor: "Erótico", etiqueta: "Erótico" }
];

window.YW.TIPOS = [
  { valor: "manga", etiqueta: "Manga (Japón)" },
  { valor: "manhwa", etiqueta: "Manhwa (Corea)" },
  { valor: "manhua", etiqueta: "Manhua (China)" },
  { valor: "webtoon", etiqueta: "Webtoon" },
  { valor: "novela_ligera", etiqueta: "Novela ligera" },
  { valor: "oneshot", etiqueta: "OneShot (un solo capítulo)" }
];

window.YW.ESTADOS = [
  { valor: "en_emision", etiqueta: "En emisión (en curso)" },
  { valor: "finalizado", etiqueta: "Finalizado" }
];

/* Secciones del catálogo. "conTipo" = pide tipo de obra y estado (solo Lecturas).
   En las demás secciones el tipo se guarda solo y no hay estado. */
window.YW.SECCIONES = {
  lecturas: {
    etiqueta: "Lecturas",
    opcion: "Lecturas (manga, manhwa, manhua, webtoon, novela ligera y OneShot)",
    autor: "Autor/a",
    sinopsis: "Sinopsis",
    enlace: "Enlace para leer la obra",
    conTipo: true,
    tipo: null,
    anilist: true,
    anchoPortada: 500,
    aviso: ""
  },
  videojuegos: {
    etiqueta: "Videojuegos",
    opcion: "Videojuegos Yuri",
    autor: "Estudio o desarrolladora",
    sinopsis: "Sinopsis",
    enlace: "Enlace del juego (tienda o sitio oficial)",
    conTipo: false,
    tipo: "videojuego",
    anilist: false,
    anchoPortada: 500,
    aviso: ""
  },
  novelas_visuales: {
    etiqueta: "Novelas visuales",
    opcion: "Novelas visuales Yuri",
    autor: "Estudio o desarrolladora",
    sinopsis: "Sinopsis",
    enlace: "Enlace de la novela visual (tienda o sitio oficial)",
    conTipo: false,
    tipo: "novela_visual",
    anilist: false,
    anchoPortada: 500,
    aviso: ""
  },
  anime: {
    etiqueta: "Anime y OVA",
    opcion: "Anime y OVA",
    autor: "Estudio de animación",
    sinopsis: "Sinopsis",
    enlace: "Enlace para ver el anime (sitio o plataforma)",
    conTipo: false,
    tipo: "anime",
    anilist: false,
    anchoPortada: 500,
    aviso: ""
  },
  series_web: {
    etiqueta: "Series web",
    opcion: "Series web (YouTube y otras plataformas)",
    autor: "Estudio o creador/a",
    sinopsis: "Sinopsis",
    enlace: "Enlace para ver la serie (YouTube u otra plataforma)",
    conTipo: false,
    tipo: "serie_web",
    anilist: false,
    anchoPortada: 500,
    aviso: ""
  },
  peliculas: {
    etiqueta: "Películas",
    opcion: "Películas Yuri",
    autor: "Director/a",
    sinopsis: "Sinopsis",
    enlace: "Enlace para ver la película",
    conTipo: false,
    tipo: "pelicula",
    anilist: false,
    anchoPortada: 500,
    aviso: ""
  },
  doujin: {
    etiqueta: "Doujin",
    opcion: "Doujin",
    autor: "Autor/a o círculo",
    sinopsis: "Sinopsis",
    enlace: "Enlace para leer la obra",
    conTipo: false,
    tipo: "doujin",
    anilist: false,
    anchoPortada: 500,
    aviso: "Recordá: en YuriWorld no se permite contenido sexual explícito. Si el doujin es para mayores de 18 años pero sin contenido explícito, marcá la casilla +18."
  },
  fanart: {
    etiqueta: "Fanart",
    opcion: "Fanart",
    autor: "Artista (quien lo dibujó)",
    sinopsis: "Descripción",
    enlace: "Enlace al original (publicación o perfil del artista)",
    conTipo: false,
    tipo: "fanart",
    anilist: false,
    anchoPortada: 1280,
    basadoEn: false,
    aviso: "Subí solo fanart propio o con permiso de quien lo dibujó. Poné su nombre y el enlace al original. No se permite contenido sexual explícito; si es para mayores de 18 años, marcá la casilla +18."
  }
};

window.YW.aplicarSeccion = function (nombre, ui) {
  const conf = window.YW.SECCIONES[nombre] || window.YW.SECCIONES.lecturas;
  if (ui.etiquetaAutor) ui.etiquetaAutor.textContent = conf.autor;
  if (ui.etiquetaSinopsis) ui.etiquetaSinopsis.textContent = conf.sinopsis;
  if (ui.camposLectura) ui.camposLectura.hidden = !conf.conTipo;
  if (ui.selectTipo) ui.selectTipo.required = conf.conTipo;
  if (ui.selectEstado) ui.selectEstado.required = conf.conTipo;
  if (ui.buscador) ui.buscador.hidden = !conf.anilist;
  if (ui.basadoEn) ui.basadoEn.hidden = conf.basadoEn === false;
  if (ui.aviso) {
    ui.aviso.textContent = conf.aviso || "";
    ui.aviso.hidden = !conf.aviso;
  }
  window.YW.rotuloEnlaceActual = conf.enlace;
  if (typeof window.YW.rotularEnlace === "function") window.YW.rotularEnlace(conf.enlace);
  if (ui.selectTipo && ui.selectEstado && !ui.selectTipo.dataset.ywOneshot) {
    ui.selectTipo.dataset.ywOneshot = "1";
    ui.selectTipo.addEventListener("change", function () {
      if (ui.selectTipo.value === "oneshot" && !ui.selectEstado.value) {
        ui.selectEstado.value = "finalizado";
      }
    });
  }
  return conf;
};

window.YW.llenarGeneros = function (contenedor) {
  window.YW.GENEROS.forEach(function (genero) {
    const etiqueta = document.createElement("label");
    etiqueta.className = "chip";

    const casilla = document.createElement("input");
    casilla.type = "checkbox";
    casilla.name = "genero";
    casilla.value = genero.valor;

    etiqueta.appendChild(casilla);
    etiqueta.appendChild(document.createTextNode(" " + genero.etiqueta));
    contenedor.appendChild(etiqueta);
  });
};

window.YW.llenarSelect = function (select, lista) {
  const vacia = document.createElement("option");
  vacia.value = "";
  vacia.textContent = "Elegí una opción";
  select.appendChild(vacia);

  lista.forEach(function (opcion) {
    const elemento = document.createElement("option");
    elemento.value = opcion.valor;
    elemento.textContent = opcion.etiqueta;
    select.appendChild(elemento);
  });
};

/* Etiquetas de tipo para mostrar en listas y resultados. */
window.YW.ETIQUETAS_TIPO = {
  manga: "Manga",
  manhwa: "Manhwa",
  manhua: "Manhua",
  webtoon: "Webtoon",
  novela_ligera: "Novela ligera",
  oneshot: "OneShot",
  videojuego: "Videojuego",
  novela_visual: "Novela visual",
  anime: "Anime / OVA",
  serie_web: "Serie web",
  pelicula: "Película",
  doujin: "Doujin",
  fanart: "Fanart"
};

/* Selector "Basado en (opcional)": busca una obra que ya esté en YuriWorld y la vincula
   como obra original (por ejemplo, el manga o la novela de un anime). */
window.YW.montarBasadoEn = function (opciones) {
  opciones = opciones || {};

  if (!document.querySelector('link[href^="css/anilist.css"]')) {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "css/anilist.css?v=1";
    document.head.appendChild(css);
  }

  let elegida = null;
  let turno = 0;
  let temporizador = null;

  function etiquetaTipo(tipo) {
    return window.YW.ETIQUETAS_TIPO[tipo] || "";
  }

  const caja = document.createElement("div");
  caja.className = "yw-basado";

  const etiqueta = document.createElement("label");
  etiqueta.textContent = "Basado en (opcional)";

  const ayuda = document.createElement("p");
  ayuda.className = "al-ayuda";
  ayuda.textContent =
    "Si es la adaptación de otra obra que ya está en YuriWorld (por ejemplo, el anime de un manga o de una novela), buscala y vinculala.";

  const entrada = document.createElement("input");
  entrada.type = "search";
  entrada.className = "al-input";
  entrada.placeholder = "Buscá el manga, la novela u otra obra original…";
  entrada.maxLength = 80;
  entrada.autocomplete = "off";
  entrada.style.width = "100%";
  entrada.style.boxSizing = "border-box";

  const estado = document.createElement("p");
  estado.className = "al-estado";

  const resultados = document.createElement("div");
  resultados.className = "al-resultados";

  const vinculo = document.createElement("div");
  vinculo.className = "al-vinculo";
  vinculo.hidden = true;

  caja.appendChild(etiqueta);
  caja.appendChild(ayuda);
  caja.appendChild(entrada);
  caja.appendChild(estado);
  caja.appendChild(resultados);
  caja.appendChild(vinculo);

  function pintarElegida() {
    vinculo.replaceChildren();
    if (!elegida) {
      vinculo.hidden = true;
      return;
    }
    vinculo.hidden = false;

    const texto = document.createElement("span");
    const tipo = etiquetaTipo(elegida.tipo);
    texto.textContent = "✔ Basado en: «" + elegida.titulo + "»" + (tipo ? " (" + tipo + ")" : "");

    const quitar = document.createElement("button");
    quitar.type = "button";
    quitar.className = "al-quitar";
    quitar.textContent = "Quitar vínculo";
    quitar.addEventListener("click", function () {
      elegida = null;
      pintarElegida();
    });

    vinculo.appendChild(texto);
    vinculo.appendChild(quitar);
  }

  function pintarResultados(lista) {
    resultados.replaceChildren();
    lista.forEach(function (rec) {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "al-resultado";

      if (rec.portada_url) {
        const imagen = document.createElement("img");
        imagen.src = rec.portada_url;
        imagen.alt = "";
        imagen.loading = "lazy";
        item.appendChild(imagen);
      }

      const texto = document.createElement("div");
      texto.className = "al-resultado-texto";
      const titulo = document.createElement("strong");
      titulo.className = "al-resultado-titulo";
      titulo.textContent = rec.titulo;
      const datos = document.createElement("span");
      datos.className = "al-resultado-datos";
      datos.textContent = [etiquetaTipo(rec.tipo), rec.autor].filter(Boolean).join(" · ");
      texto.appendChild(titulo);
      texto.appendChild(datos);
      item.appendChild(texto);

      item.addEventListener("click", function () {
        elegida = { id: rec.id, titulo: rec.titulo, tipo: rec.tipo };
        entrada.value = "";
        resultados.replaceChildren();
        estado.textContent = "";
        pintarElegida();
      });

      resultados.appendChild(item);
    });
  }

  async function consultar(clausulas, texto) {
    let consulta = supabaseClient
      .from("recomendaciones")
      .select("id, titulo, autor, portada_url, tipo")
      .or(clausulas)
      .order("created_at", { ascending: false })
      .limit(8);
    if (opciones.idPropio) consulta = consulta.neq("id", opciones.idPropio);
    return consulta;
  }

  async function buscar() {
    const texto = entrada.value.replace(/[,()%*\\"]/g, " ").trim();
    turno += 1;
    const miTurno = turno;

    if (texto.length < 2) {
      resultados.replaceChildren();
      estado.textContent = "";
      return;
    }

    estado.textContent = "Buscando...";

    let respuesta = await consultar(
      "titulo.ilike.%" + texto + "%,autor.ilike.%" + texto + "%,titulos_busqueda.ilike.%" + texto + "%",
      texto
    );
    if (respuesta.error) {
      respuesta = await consultar("titulo.ilike.%" + texto + "%,autor.ilike.%" + texto + "%", texto);
    }
    if (miTurno !== turno) return;

    if (respuesta.error) {
      estado.textContent = "No se pudo buscar ahora. Probá de nuevo.";
      return;
    }

    const lista = respuesta.data || [];
    if (lista.length === 0) {
      estado.textContent = "No encontramos esa obra en YuriWorld.";
      resultados.replaceChildren();
      return;
    }

    estado.textContent = "Tocá la obra original:";
    pintarResultados(lista);
  }

  entrada.addEventListener("keydown", function (evento) {
    if (evento.key === "Enter") {
      evento.preventDefault();
      buscar();
    }
  });
  entrada.addEventListener("input", function () {
    clearTimeout(temporizador);
    temporizador = setTimeout(buscar, 600);
  });

  return {
    caja: caja,
    valor: function () {
      return elegida ? elegida.id : null;
    },
    fijar: function (obra) {
      elegida = obra || null;
      pintarElegida();
    },
    limpiar: function () {
      elegida = null;
      entrada.value = "";
      resultados.replaceChildren();
      estado.textContent = "";
      pintarElegida();
    }
  };
};
   
