(function () {
  const cuerpo = document.getElementById("ex-cuerpo");
  const pestanas = document.querySelector(".ex-pestanas");
  const entrada = document.getElementById("ex-q");
  if (!cuerpo || !pestanas || !entrada) return;

  if (!document.querySelector('link[href^="css/secciones.css"]')) {
    const enlace = document.createElement("link");
    enlace.rel = "stylesheet";
    enlace.href = "css/secciones.css?v=1";
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

  let tipoActivo = "";
  let turno = 0;
  let programado = null;

  const barra = document.createElement("div");
  barra.className = "yw-filtro-tipos";
  barra.hidden = true;
  pestanas.insertAdjacentElement("afterend", barra);

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
    barra.querySelectorAll(".yw-chip-tipo").forEach(function (chip) {
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

      if (!tipoActivo) {
        const pestanaObras = document.querySelector('.ex-pestana[data-pestana="obras"]');
        if (pestanaObras) pestanaObras.click();
      } else {
        aplicarFiltro();
      }
    });

    barra.appendChild(chip);
  });

  pintarChips();

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

  function envolver(nodos) {
    const envoltorio = document.createElement("div");
    envoltorio.dataset.ywFiltro = "1";
    nodos.forEach(function (nodo) {
      envoltorio.appendChild(nodo);
    });
    return envoltorio;
  }

  async function aplicarFiltro() {
    if (!tipoActivo) return;
    turno += 1;
    const miTurno = turno;

    cuerpo.replaceChildren(envolver([crearMensaje("Cargando...")]));

    const q = limpiarTexto(entrada.value);

    let consulta = supabaseClient
      .from("recomendaciones")
      .select("id, titulo, autor, generos, portada_url")
      .eq("tipo", tipoActivo)
      .order("created_at", { ascending: false })
      .limit(30);

    if (q) {
      consulta = consulta.or("titulo.ilike.%" + q + "%,autor.ilike.%" + q + "%");
    }

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
        const { data: porGenero } = await supabaseClient
          .from("recomendaciones")
          .select("id, titulo, autor, generos, portada_url")
          .eq("tipo", tipoActivo)
          .contains("generos", [genero.valor])
          .order("created_at", { ascending: false })
          .limit(30);

        (porGenero || []).forEach(function (rec) {
          if (!obras.some(function (existente) { return existente.id === rec.id; })) {
            obras.push(rec);
          }
        });
      }
    }

    const mapa = {};
    if (obras.length > 0) {
      const { data: resumenes } = await supabaseClient
        .from("resumen_calificaciones")
        .select("recomendacion_id, promedio, cantidad")
        .in(
          "recomendacion_id",
          obras.map(function (rec) {
            return rec.id;
          })
        );
      (resumenes || []).forEach(function (resumen) {
        mapa[resumen.recomendacion_id] = resumen;
      });
    }

    if (miTurno !== turno) return;

    const etiqueta = (TIPOS.find(function (par) { return par[0] === tipoActivo; }) || ["", ""])[1];
    const titulo = document.createElement("h2");
    titulo.className = "yw-titulo-filtro";
    titulo.textContent = etiqueta;

    const nodos = [titulo];
    if (obras.length === 0) {
      nodos.push(
        crearMensaje(
          q
            ? "No encontramos «" + entrada.value.trim() + "» entre las obras de este tipo."
            : "Todavía no hay obras de este tipo."
        )
      );
    } else {
      obras.forEach(function (rec) {
        nodos.push(crearFila(rec, mapa[rec.id]));
      });
    }

    cuerpo.replaceChildren(envolver(nodos));
  }

  function alCambiarCuerpo() {
    if (!tipoActivo || !esObras()) return;
    const primero = cuerpo.firstElementChild;
    if (primero && primero.dataset.ywFiltro === "1") return;

    clearTimeout(programado);
    programado = setTimeout(aplicarFiltro, 150);
  }

  new MutationObserver(alCambiarCuerpo).observe(cuerpo, { childList: true });

  function actualizarBarra() {
    const visible = esObras();
    barra.hidden = !visible;
    if (!visible && tipoActivo) {
      tipoActivo = "";
      pintarChips();
    }
  }

  new MutationObserver(actualizarBarra).observe(pestanas, {
    attributes: true,
    attributeFilter: ["class"],
    subtree: true
  });

  actualizarBarra();
})();
