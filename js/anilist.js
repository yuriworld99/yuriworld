(function () {
  window.YW = window.YW || {};

  const ENDPOINT = "https://graphql.anilist.co";

  const CONSULTA =
    "query ($busqueda: String) {" +
    "  Page(page: 1, perPage: 8) {" +
    "    media(search: $busqueda, type: MANGA, sort: SEARCH_MATCH) {" +
    "      id idMal title { romaji english native } synonyms format status" +
    "      countryOfOrigin isAdult genres startDate { year }" +
    "      coverImage { medium }" +
    "      staff(perPage: 6, sort: RELEVANCE) { edges { role node { name { full } } } }" +
    "    }" +
    "  }" +
    "}";

  const GENEROS = {
    "Action": "Acción",
    "Adventure": "Aventura",
    "Comedy": "Comedia",
    "Drama": "Drama",
    "Fantasy": "Fantasía",
    "Horror": "Terror",
    "Mystery": "Misterio",
    "Psychological": "Psicológico",
    "Romance": "Romance",
    "Sci-Fi": "Ciencia ficción",
    "Slice of Life": "Slice of life",
    "Sports": "Deporte",
    "Supernatural": "Sobrenatural",
    "Thriller": "Suspenso",
    "Music": "Musical",
    "Ecchi": "Erótico",
    "Hentai": "Erótico"
  };

  const ETIQUETAS_TIPO = {
    manga: "Manga",
    manhwa: "Manhwa",
    manhua: "Manhua",
    webtoon: "Webtoon",
    novela_ligera: "Novela ligera",
    oneshot: "OneShot"
  };

  const ETIQUETAS_ESTADO = { en_emision: "En emisión", finalizado: "Finalizado" };

  function normalizarTexto(texto) {
    return String(texto || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "");
  }

  function tipoDe(media) {
    if (media.format === "ONE_SHOT") return "oneshot";
    if (media.format === "NOVEL") return "novela_ligera";
    const pais = media.countryOfOrigin;
    if (pais === "KR") return "manhwa";
    if (pais === "CN" || pais === "TW" || pais === "HK") return "manhua";
    return "manga";
  }

  function estadoDe(media) {
    if (media.status === "RELEASING") return "en_emision";
    if (media.status === "FINISHED") return "finalizado";
    return "";
  }

  function generosDe(media) {
    const lista = [];
    const originales = media.genres || [];

    originales.forEach(function (genero) {
      const nuestro = GENEROS[genero];
      if (nuestro && lista.indexOf(nuestro) === -1) lista.push(nuestro);
    });

    const tiene = function (nombre) {
      return originales.indexOf(nombre) !== -1;
    };
    if (tiene("Romance") && tiene("Comedy")) lista.push("Romance y comedia (RomCom)");
    if (tiene("Romance") && tiene("Drama")) lista.push("Drama romántico");

    return lista;
  }

  function autorDe(media) {
    const nombres = [];
    const aristas = media.staff && media.staff.edges ? media.staff.edges : [];

    aristas.forEach(function (arista) {
      const rol = arista.role || "";
      const nombre = arista.node && arista.node.name ? arista.node.name.full : "";
      if (/story|art|original|creator/i.test(rol) && nombre && nombres.indexOf(nombre) === -1) {
        nombres.push(nombre);
      }
    });

    return nombres.slice(0, 3).join(", ");
  }

  function titulosDe(media) {
    const t = media.title || {};
    const principal = t.english || t.romaji || t.native || "";
    const todos = [t.english, t.romaji, t.native].concat(media.synonyms || []);
    const vistos = {};
    const alternativos = [];

    vistos[normalizarTexto(principal)] = true;
    todos.forEach(function (titulo) {
      if (!titulo) return;
      const clave = normalizarTexto(titulo);
      if (!clave || vistos[clave]) return;
      vistos[clave] = true;
      if (titulo.length <= 120 && alternativos.length < 12) alternativos.push(titulo);
    });

    return { principal: principal, alternativos: alternativos };
  }

  function normalizar(media) {
    const titulos = titulosDe(media);
    return {
      anilistId: media.id,
      malId: media.idMal || null,
      titulo: titulos.principal.slice(0, 120),
      alternativos: titulos.alternativos,
      tipo: tipoDe(media),
      estado: estadoDe(media),
      es18: !!media.isAdult,
      generos: generosDe(media),
      autor: autorDe(media).slice(0, 120),
      anio: media.startDate ? media.startDate.year : null,
      portada: media.coverImage ? media.coverImage.medium : null,
      existente: null
    };
  }

  async function buscar(texto) {
    const busqueda = String(texto || "").trim();
    if (busqueda.length < 2) return [];

    let respuesta;
    try {
      respuesta = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ query: CONSULTA, variables: { busqueda: busqueda } })
      });
    } catch (error) {
      throw new Error("red");
    }

    if (respuesta.status === 429) throw new Error("limite");
    if (!respuesta.ok) throw new Error("servicio");

    const datos = await respuesta.json();
    const lista =
      datos && datos.data && datos.data.Page && datos.data.Page.media ? datos.data.Page.media : [];
    return lista.map(normalizar);
  }

  async function marcarExistentes(obras, idExcluido) {
    if (obras.length === 0) return;

    try {
      const ids = obras.map(function (obra) {
        return obra.anilistId;
      });
      const { data } = await supabaseClient
        .from("recomendaciones")
        .select("id, titulo, anilist_id")
        .in("anilist_id", ids);

      (data || []).forEach(function (fila) {
        if (idExcluido && fila.id === idExcluido) return;
        obras.forEach(function (obra) {
          if (obra.anilistId === fila.anilist_id) obra.existente = fila;
        });
      });
    } catch (error) {
      console.error(error);
    }
  }

  function parsearOtros(texto) {
    const vistos = {};
    const lista = [];
    String(texto || "")
      .split("\n")
      .forEach(function (linea) {
        const limpia = linea.trim().slice(0, 120);
        const clave = normalizarTexto(limpia);
        if (!limpia || !clave || vistos[clave]) return;
        vistos[clave] = true;
        if (lista.length < 20) lista.push(limpia);
      });
    return lista;
  }

  function disparar(elemento) {
    elemento.dispatchEvent(new Event("input", { bubbles: true }));
    elemento.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function rellenar(obra, campos, sobrescribir) {
    function poner(elemento, valor, forzar) {
      if (!elemento || !valor) return;
      if (!forzar && elemento.value) return;
      elemento.value = valor;
      disparar(elemento);
    }

    poner(campos.titulo, obra.titulo, false);
    poner(campos.autor, obra.autor, false);
    poner(campos.tipo, obra.tipo, !!sobrescribir);
    poner(campos.estado, obra.estado, !!sobrescribir);

    if (campos.es18 && obra.es18) {
      campos.es18.checked = true;
      disparar(campos.es18);
    }

    if (campos.otros) {
      const tituloFinal = campos.titulo ? campos.titulo.value : "";
      const candidatos = parsearOtros(campos.otros.value).concat([obra.titulo], obra.alternativos);
      const vistos = {};
      vistos[normalizarTexto(tituloFinal)] = true;
      const resultado = [];

      candidatos.forEach(function (titulo) {
        const clave = normalizarTexto(titulo);
        if (!titulo || !clave || vistos[clave]) return;
        vistos[clave] = true;
        if (resultado.length < 20) resultado.push(titulo);
      });

      campos.otros.value = resultado.join("\n");
      disparar(campos.otros);
    }

    document.querySelectorAll('input[name="genero"]').forEach(function (casilla) {
      if (obra.generos.indexOf(casilla.value) !== -1) casilla.checked = true;
    });
  }

  function crear(clase, etiqueta, texto) {
    const elemento = document.createElement(etiqueta || "div");
    if (clase) elemento.className = clase;
    if (texto) elemento.textContent = texto;
    return elemento;
  }

  function montar(opciones) {
    const contenedor = opciones.contenedor;
    let vinculada = null;
    let turno = 0;
    let temporizador = null;

    if (!document.querySelector('link[href^="css/anilist.css"]')) {
      const enlaceCss = document.createElement("link");
      enlaceCss.rel = "stylesheet";
      enlaceCss.href = "css/anilist.css?v=1";
      document.head.appendChild(enlaceCss);
    }

    const caja = crear("al-caja");
    caja.appendChild(crear("al-titulo", "p", "Buscar la obra"));
    caja.appendChild(
      crear(
        "al-ayuda",
        "p",
        "Escribí el nombre en cualquier idioma (español, inglés, romaji, japonés…). Se completan solos el tipo, el estado, el +18, los géneros y los otros títulos."
      )
    );

    const fila = crear("al-fila");
    const entrada = document.createElement("input");
    entrada.type = "search";
    entrada.className = "al-input";
    entrada.placeholder = "Ej: Citrus, シトラス, Girl Friends…";
    entrada.maxLength = 80;
    entrada.autocomplete = "off";

    const boton = crear("al-boton", "button", "Buscar");
    boton.type = "button";

    fila.appendChild(entrada);
    fila.appendChild(boton);
    caja.appendChild(fila);

    const estado = crear("al-estado", "p");
    const resultados = crear("al-resultados");
    const vinculo = crear("al-vinculo");
    vinculo.hidden = true;
    const credito = crear("al-credito", "p", "Datos de AniList. Si la obra no aparece, completala a mano más abajo.");

    caja.appendChild(estado);
    caja.appendChild(resultados);
    caja.appendChild(vinculo);
    caja.appendChild(credito);
    contenedor.appendChild(caja);

    function mensaje(texto) {
      estado.replaceChildren();
      estado.appendChild(document.createTextNode(texto || ""));
    }

    function pintarVinculo() {
      vinculo.replaceChildren();
      if (!vinculada) {
        vinculo.hidden = true;
        window.YW.anilistActual = null;
        return;
      }

      vinculo.hidden = false;
      window.YW.anilistActual = vinculada.anilistId;
      vinculo.appendChild(
        crear("", "span", "✔ Vinculada: " + (vinculada.titulo || "obra") + " (n.º " + vinculada.anilistId + ")")
      );

      const quitar = crear("al-quitar", "button", "Quitar vínculo");
      quitar.type = "button";
      quitar.addEventListener("click", function () {
        vinculada = null;
        pintarVinculo();
        if (opciones.alQuitar) opciones.alQuitar();
      });
      vinculo.appendChild(quitar);
    }

    function elegir(obra) {
      if (obra.existente) {
        estado.replaceChildren();
        estado.appendChild(
          document.createTextNode("Esta obra ya está en YuriWorld: «" + obra.existente.titulo + "». ")
        );
        const enlace = document.createElement("a");
        enlace.href = "recomendacion.html?id=" + encodeURIComponent(obra.existente.id);
        enlace.textContent = "Verla, calificarla y comentarla";
        estado.appendChild(enlace);
        return;
      }

      vinculada = obra;
      pintarVinculo();
      resultados.replaceChildren();
      mensaje("Listo: completamos los datos. Revisalos y agregá la sinopsis y la portada.");
      if (opciones.alElegir) opciones.alElegir(obra);
    }

    function pintarResultados(obras) {
      resultados.replaceChildren();

      obras.forEach(function (obra) {
        const item = crear("al-resultado", "button");
        item.type = "button";

        if (obra.portada) {
          const imagen = document.createElement("img");
          imagen.src = obra.portada;
          imagen.alt = "";
          imagen.loading = "lazy";
          item.appendChild(imagen);
        }

        const texto = crear("al-resultado-texto");
        texto.appendChild(crear("al-resultado-titulo", "strong", obra.titulo || "(sin título)"));

        const partes = [ETIQUETAS_TIPO[obra.tipo]];
        if (obra.anio) partes.push(String(obra.anio));
        if (obra.estado) partes.push(ETIQUETAS_ESTADO[obra.estado]);
        if (obra.es18) partes.push("+18");
        texto.appendChild(crear("al-resultado-datos", "span", partes.join(" · ")));

        if (obra.existente) {
          texto.appendChild(crear("al-ya", "span", "Ya está en YuriWorld"));
        }

        item.appendChild(texto);
        item.addEventListener("click", function () {
          elegir(obra);
        });
        resultados.appendChild(item);
      });
    }

    async function ejecutar() {
      const texto = entrada.value.trim();
      turno += 1;
      const miTurno = turno;

      if (texto.length < 2) {
        resultados.replaceChildren();
        mensaje("");
        return;
      }

      mensaje("Buscando...");
      resultados.replaceChildren();

      try {
        const obras = await buscar(texto);
        await marcarExistentes(obras, opciones.idExcluido || null);
        if (miTurno !== turno) return;

        if (obras.length === 0) {
          mensaje("No encontramos esa obra. Podés completar los datos a mano más abajo.");
          return;
        }
        mensaje("Tocá la obra correcta:");
        pintarResultados(obras);
      } catch (error) {
        if (miTurno !== turno) return;
        if (error.message === "limite") {
          mensaje("Hiciste muchas búsquedas seguidas. Esperá un minuto y probá de nuevo.");
        } else {
          mensaje("No pudimos consultar la base de datos de mangas ahora. Completá los datos a mano.");
        }
      }
    }

    boton.addEventListener("click", ejecutar);
    entrada.addEventListener("keydown", function (evento) {
      if (evento.key === "Enter") {
        evento.preventDefault();
        ejecutar();
      }
    });
    entrada.addEventListener("input", function () {
      clearTimeout(temporizador);
      temporizador = setTimeout(ejecutar, 900);
    });

    return {
      vinculada: function () {
        return vinculada;
      },
      vincular: function (obra) {
        vinculada = obra;
        pintarVinculo();
      }
    };
  }

  window.YW.anilist = {
    buscar: buscar,
    normalizar: normalizar,
    montar: montar,
    rellenar: rellenar,
    parsearOtros: parsearOtros,
    normalizarTexto: normalizarTexto
  };
})();
 
