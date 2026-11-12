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
  { valor: "novela_ligera", etiqueta: "Novela ligera" }
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
    opcion: "Lecturas (manga, manhwa, manhua, webtoon y novela ligera)",
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
  oneshot: {
    etiqueta: "OneShot",
    opcion: "OneShot",
    autor: "Autor/a",
    sinopsis: "Sinopsis",
    enlace: "Enlace para leer la obra",
    conTipo: false,
    tipo: "oneshot",
    anilist: true,
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
  if (ui.aviso) {
    ui.aviso.textContent = conf.aviso || "";
    ui.aviso.hidden = !conf.aviso;
  }
  window.YW.rotuloEnlaceActual = conf.enlace;
  if (typeof window.YW.rotularEnlace === "function") window.YW.rotularEnlace(conf.enlace);
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
  
