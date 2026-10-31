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
  { valor: "webtoon", etiqueta: "Webtoon" }
];

window.YW.ESTADOS = [
  { valor: "en_emision", etiqueta: "En emisión (en curso)" },
  { valor: "finalizado", etiqueta: "Finalizado" }
];

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
