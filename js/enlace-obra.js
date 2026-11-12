(function () {
  window.YW = window.YW || {};

  const ruta = window.location.pathname;
  const enPublicar = /\/publicar\.html$/.test(ruta);
  const enEditar = /\/editar-recomendacion\.html$/.test(ruta);
  const enDetalle = /\/recomendacion\.html$/.test(ruta);
  const enForo = /\/foro\.html$/.test(ruta);
  if (!enPublicar && !enEditar && !enDetalle && !enForo) return;

  const IDIOMAS = { es: "Español", en: "Inglés", pt: "Portugués", otro: "Otro idioma" };

  const TEXTOS_ENLACE = {
    videojuegos: {
      boton: "🎮 Ir al juego",
      aviso: "Enlace agregado por quien recomendó el juego. YuriWorld no controla ese sitio."
    },
    peliculas: {
      boton: "🎬 Ver la película",
      aviso: "Enlace agregado por quien recomendó la película. YuriWorld no controla ese sitio."
    },
    fanart: {
      boton: "🎨 Ver el original",
      aviso: "Enlace al original agregado por quien subió el fanart. YuriWorld no controla ese sitio."
    }
  };
  const TEXTO_POR_DEFECTO = {
    boton: "📖 Leer la obra",
    aviso: "Enlace agregado por quien recomendó la obra. YuriWorld no controla ese sitio."
  };

  function crear(etiqueta, clase, texto) {
    const elemento = document.createElement(etiqueta);
    if (clase) elemento.className = clase;
    if (texto) elemento.textContent = texto;
    return elemento;
  }

  // Acepta cualquier dirección http o https. Agrega https:// si falta.
  function normalizarDireccion(texto) {
    let direccion = String(texto || "").trim();
    if (!direccion) return null;
    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(direccion)) direccion = "https://" + direccion;

    let url;
    try {
      url = new URL(direccion);
    } catch (error) {
      return null;
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname || url.hostname.indexOf(".") === -1) return null;
    if (url.href.length > 500) return null;
    return url.href;
  }

  function dominioDe(direccion) {
    try {
      return new URL(direccion).hostname.replace(/^www\./, "");
    } catch (error) {
      return direccion;
    }
  }

  // ---------- Campos del enlace (formularios) ----------
  function crearBloque(idBase, obligatorio) {
    const caja = crear("div", "yw-enlace-campos");

    function textoEtiqueta(base) {
      return obligatorio ? base + " (obligatorio)" : base;
    }

    const etiqueta = document.createElement("label");
    etiqueta.setAttribute("for", idBase + "-url");
    etiqueta.textContent = textoEtiqueta(window.YW.rotuloEnlaceActual || "Enlace para leer la obra");

    const campoUrl = document.createElement("input");
    campoUrl.type = "text";
    campoUrl.inputMode = "url";
    campoUrl.id = idBase + "-url";
    campoUrl.placeholder = "https://… (dónde se puede ver)";
    campoUrl.maxLength = 500;
    campoUrl.autocomplete = "off";
    campoUrl.style.width = "100%";
    campoUrl.style.boxSizing = "border-box";

    const campoNombre = document.createElement("input");
    campoNombre.type = "text";
    campoNombre.id = idBase + "-nombre";
    campoNombre.placeholder = "Nombre del sitio (opcional)";
    campoNombre.maxLength = 60;
    campoNombre.style.width = "100%";
    campoNombre.style.boxSizing = "border-box";
    campoNombre.style.marginTop = "8px";

    const campoIdioma = document.createElement("select");
    campoIdioma.id = idBase + "-idioma";
    campoIdioma.className = "yw-select";
    campoIdioma.style.marginTop = "8px";
    Object.keys(IDIOMAS).forEach(function (clave) {
      const opcion = document.createElement("option");
      opcion.value = clave;
      opcion.textContent = "Idioma: " + IDIOMAS[clave];
      campoIdioma.appendChild(opcion);
    });

    caja.appendChild(etiqueta);
    caja.appendChild(campoUrl);
    caja.appendChild(campoNombre);
    caja.appendChild(campoIdioma);

    return {
      caja: caja,
      campoUrl: campoUrl,
      obligatorio: obligatorio,
      rotular: function (base) {
        etiqueta.textContent = textoEtiqueta(base);
      },
      valores: function () {
        const texto = campoUrl.value.trim();
        const url = texto ? normalizarDireccion(texto) : null;
        return {
          vacio: !texto,
          valido: !texto || !!url,
          url: url,
          etiqueta: campoNombre.value.trim() || null,
          idioma: campoIdioma.value
        };
      },
      llenar: function (url, nombre, idioma) {
        campoUrl.value = url || "";
        campoNombre.value = nombre || "";
        campoIdioma.value = idioma && IDIOMAS[idioma] ? idioma : "es";
      },
      vaciar: function () {
        campoUrl.value = "";
        campoNombre.value = "";
        campoIdioma.value = "es";
      },
      error: function () {
        const v = this.valores();
        if (obligatorio && v.vacio) return "Falta el enlace. Es obligatorio.";
        if (!v.valido) return "El enlace no es válido. Tiene que ser una dirección como https://sitio.com/obra";
        return null;
      }
    };
  }

  // Agrega los datos del enlace a lo que se guarda en la base de datos.
  let bloqueActivo = null;
  let modoEditar = false;

  // Lo llama generos.js cuando se cambia de sección, para ajustar el rótulo.
  window.YW.rotularEnlace = function (texto) {
    window.YW.rotuloEnlaceActual = texto;
    if (bloqueActivo) bloqueActivo.rotular(texto);
  };

  const desdeOriginal = supabaseClient.from.bind(supabaseClient);
  supabaseClient.from = function (tabla) {
    const consulta = desdeOriginal(tabla);
    if (tabla !== "recomendaciones") return consulta;

    function agregarDatos(datos) {
      if (!bloqueActivo || !datos || Array.isArray(datos) || !datos.titulo) return;
      const v = bloqueActivo.valores();
      datos.enlace_url = v.url || null;
      datos.enlace_etiqueta = v.url ? v.etiqueta : null;
      datos.enlace_idioma = v.url ? v.idioma : "es";
    }

    const insertarOriginal = consulta.insert.bind(consulta);
    consulta.insert = function (datos, opciones) {
      agregarDatos(datos);
      return insertarOriginal(datos, opciones);
    };

    const actualizarOriginal = consulta.update.bind(consulta);
    consulta.update = function (datos, opciones) {
      if (modoEditar) agregarDatos(datos);
      return actualizarOriginal(datos, opciones);
    };

    return consulta;
  };

  function esperar(condicion, alTerminar, intentosMax) {
    let intentos = 0;
    const reloj = setInterval(function () {
      intentos += 1;
      const resultado = condicion();
      if (resultado) {
        clearInterval(reloj);
        alTerminar(resultado);
      } else if (intentos > (intentosMax || 100)) {
        clearInterval(reloj);
      }
    }, 100);
  }

  // ---------- Pantalla Publicar ----------
  if (enPublicar) {
    esperar(
      function () {
        return document.getElementById("otros-titulos") && document.getElementById("form-publicar");
      },
      function () {
        const formulario = document.getElementById("form-publicar");
        const campoOtros = document.getElementById("otros-titulos");
        const mensaje = document.getElementById("mensaje");

        bloqueActivo = crearBloque("yw-enlace", true);
        campoOtros.insertAdjacentElement("afterend", bloqueActivo.caja);

        formulario.addEventListener(
          "submit",
          function (evento) {
            const problema = bloqueActivo.error();
            if (!problema) return;
            evento.stopImmediatePropagation();
            evento.preventDefault();
            if (mensaje) {
              mensaje.textContent = problema;
              mensaje.className = "mensaje error";
            }
            bloqueActivo.campoUrl.focus();
          },
          true
        );
      }
    );
  }

  // ---------- Panel de recomendación de la Comunidad ----------
  if (enForo) {
    esperar(
      function () {
        return (
          document.getElementById("rec-otros") &&
          document.getElementById("panel-recomendacion") &&
          document.getElementById("boton-publicar")
        );
      },
      function () {
        const panel = document.getElementById("panel-recomendacion");
        const campoOtros = document.getElementById("rec-otros");
        const botonPublicar = document.getElementById("boton-publicar");
        const mensaje = document.getElementById("mensaje-compositor");

        bloqueActivo = crearBloque("yw-enlace", true);
        campoOtros.insertAdjacentElement("afterend", bloqueActivo.caja);

        botonPublicar.addEventListener(
          "click",
          function (evento) {
            if (panel.hidden) return;
            const problema = bloqueActivo.error();
            if (!problema) return;
            evento.stopImmediatePropagation();
            evento.preventDefault();
            if (mensaje) {
              mensaje.textContent = problema;
              mensaje.className = "muro-mensaje error";
            }
            bloqueActivo.campoUrl.focus();
          },
          true
        );

        new MutationObserver(function () {
          if (panel.hidden) bloqueActivo.vaciar();
        }).observe(panel, { attributes: true, attributeFilter: ["hidden"] });
      },
      200
    );
  }

  // ---------- Pantalla Editar ----------
  if (enEditar) {
    esperar(
      function () {
        return document.getElementById("otros-titulos") && document.getElementById("form-editar");
      },
      async function () {
        const formulario = document.getElementById("form-editar");
        const campoOtros = document.getElementById("otros-titulos");
        const mensaje = document.getElementById("mensaje");
        const id = new URLSearchParams(window.location.search).get("id");

        modoEditar = true;
        bloqueActivo = crearBloque("yw-enlace", false);
        campoOtros.insertAdjacentElement("afterend", bloqueActivo.caja);

        formulario.addEventListener(
          "submit",
          function (evento) {
            const problema = bloqueActivo.error();
            if (!problema) return;
            evento.stopImmediatePropagation();
            evento.preventDefault();
            if (mensaje) {
              mensaje.textContent = problema;
              mensaje.className = "mensaje error";
            }
            bloqueActivo.campoUrl.focus();
          },
          true
        );

        if (!id) return;
        const { data } = await supabaseClient
          .from("recomendaciones")
          .select("enlace_url, enlace_etiqueta, enlace_idioma")
          .eq("id", id)
          .maybeSingle();
        if (data) bloqueActivo.llenar(data.enlace_url, data.enlace_etiqueta, data.enlace_idioma);
      }
    );
  }

  // ---------- Página de la obra: el enlace va debajo de los otros nombres ----------
  if (enDetalle) {
    const id = new URLSearchParams(window.location.search).get("id");
    const autor = document.getElementById("detalle-autor");
    if (!id || !autor) return;

    const estilo = document.createElement("style");
    estilo.textContent =
      ".yw-leer { margin: 0 0 12px; }" +
      "a.yw-leer-enlace { display: inline-flex; flex-direction: column; gap: 2px; padding: 10px 16px; border: 2px solid var(--violeta-texto, #7b3fe4); border-radius: 14px; background: var(--superficie, #ffffff); color: var(--violeta-texto, #7b3fe4); text-decoration: none; }" +
      "a.yw-leer-enlace strong { font-size: 1rem; }" +
      "a.yw-leer-enlace span { color: var(--texto-suave, #6d5d7d); font-size: 0.85rem; overflow-wrap: anywhere; }" +
      ".yw-leer-aviso { margin: 6px 0 0; color: var(--texto-suave, #8b7a9c); font-size: 0.78rem; }" +
      ".yw-leer-vacio { margin: 0 0 12px; color: var(--texto-suave, #6d5d7d); font-size: 0.9rem; }" +
      ".yw-leer-vacio a { color: var(--violeta-texto, #7b3fe4); font-weight: 700; }";
    document.head.appendChild(estilo);

    (async function mostrar() {
      const { data: obra } = await supabaseClient
        .from("recomendaciones")
        .select("user_id, enlace_url, enlace_etiqueta, enlace_idioma, seccion")
        .eq("id", id)
        .maybeSingle();
      if (!obra) return;

      const textos = TEXTOS_ENLACE[obra.seccion] || TEXTO_POR_DEFECTO;
      let bloque = null;

      if (obra.enlace_url) {
        bloque = crear("div", "yw-leer");

        const vinculo = document.createElement("a");
        vinculo.className = "yw-leer-enlace";
        vinculo.href = obra.enlace_url;
        vinculo.target = "_blank";
        vinculo.rel = "noopener noreferrer nofollow ugc";
        vinculo.appendChild(crear("strong", "", textos.boton));
        vinculo.appendChild(
          crear(
            "span",
            "",
            (obra.enlace_etiqueta || dominioDe(obra.enlace_url)) +
              " · " +
              (IDIOMAS[obra.enlace_idioma] || "Español") +
              " ↗"
          )
        );
        bloque.appendChild(vinculo);
        bloque.appendChild(crear("p", "yw-leer-aviso", textos.aviso));
      } else {
        const { data: datosSesion } = await supabaseClient.auth.getSession();
        const miId = datosSesion.session ? datosSesion.session.user.id : null;
        let puedeEditar = !!miId && obra.user_id === miId;
        if (miId && !puedeEditar) {
          const { data: esAdmin } = await supabaseClient.rpc("es_administrador");
          puedeEditar = esAdmin === true;
        }
        if (!puedeEditar) return;

        bloque = crear("p", "yw-leer-vacio");
        bloque.appendChild(document.createTextNode("Esta obra todavía no tiene enlace. "));
        const agregar = document.createElement("a");
        agregar.href = "editar-recomendacion.html?id=" + encodeURIComponent(id);
        agregar.textContent = "Agregar enlace";
        bloque.appendChild(agregar);
      }

      function colocar() {
        const otros = document.querySelector("#contenido .yw-otros-titulos");
        const insignias = document.querySelector("#contenido .yw-insignias");
        const referencia = otros || insignias;
        if (!referencia) return false;
        referencia.insertAdjacentElement("afterend", bloque);
        return true;
      }

      let intentos = 0;
      const reloj = setInterval(function () {
        intentos += 1;
        if (colocar()) {
          clearInterval(reloj);
        } else if (intentos > 30) {
          clearInterval(reloj);
          autor.insertAdjacentElement("afterend", bloque);
        }
      }, 100);
    })();
  }
})();
    
