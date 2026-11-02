(function () {
  const EXCLUIDOS = ["sinopsis", "rec-sinopsis", "texto-descripcion"];
  const SELECTORES = ".post-texto, .respuesta-texto, .comentario-texto";
  const PATRON = /(^|[^A-Za-z0-9_])([@#])([\p{L}\p{N}_]{2,40})/gu;

  if (!document.querySelector('link[href^="css/menciones.css"]')) {
    const enlaceCss = document.createElement("link");
    enlaceCss.rel = "stylesheet";
    enlaceCss.href = "css/menciones.css?v=1";
    document.head.appendChild(enlaceCss);
  }

  function crearEnlace(simbolo, palabra) {
    const enlace = document.createElement("a");
    if (simbolo === "@") {
      enlace.className = "yw-mencion";
      enlace.href = "usuario.html?u=" + encodeURIComponent(palabra);
    } else {
      enlace.className = "yw-hashtag";
      enlace.href = "explorar.html?q=" + encodeURIComponent("#" + palabra);
    }
    enlace.textContent = simbolo + palabra;
    enlace.addEventListener("click", function (evento) {
      evento.stopPropagation();
    });
    return enlace;
  }

  function convertir(elemento) {
    elemento.dataset.ywMenc = "1";
    const texto = elemento.textContent;
    if (!texto || (texto.indexOf("@") === -1 && texto.indexOf("#") === -1)) return;

    const fragmento = document.createDocumentFragment();
    let ultimo = 0;
    let huboCambios = false;
    PATRON.lastIndex = 0;

    let coincidencia;
    while ((coincidencia = PATRON.exec(texto)) !== null) {
      const inicioSimbolo = coincidencia.index + coincidencia[1].length;
      const simbolo = coincidencia[2];
      const palabra = coincidencia[3];

      if (simbolo === "@" && (palabra.length < 3 || palabra.length > 20 || !/^[A-Za-z0-9_]+$/.test(palabra))) {
        continue;
      }

      fragmento.appendChild(document.createTextNode(texto.slice(ultimo, inicioSimbolo)));
      fragmento.appendChild(crearEnlace(simbolo, palabra));
      ultimo = inicioSimbolo + 1 + palabra.length;
      huboCambios = true;
    }

    if (!huboCambios) return;

    fragmento.appendChild(document.createTextNode(texto.slice(ultimo)));
    elemento.replaceChildren(fragmento);
  }

  let pendiente = false;

  function procesar() {
    document
      .querySelectorAll(SELECTORES.split(",").map(function (s) { return s.trim() + ":not([data-yw-menc])"; }).join(", "))
      .forEach(convertir);
  }

  function programar() {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(function () {
      pendiente = false;
      procesar();
    });
  }

  new MutationObserver(programar).observe(document.body, { childList: true, subtree: true });
  programar();

  // ---------- Sugerencias al escribir @ ----------
  let temporizador = null;
  let turno = 0;
  let panelActual = null;

  function quitarPanel() {
    if (panelActual) {
      panelActual.remove();
      panelActual = null;
    }
  }

  function escaparLike(texto) {
    return texto.replace(/[\\%_]/g, "\\$&");
  }

  function elegir(areaTexto, consulta, nombre) {
    const caret = areaTexto.selectionStart;
    const antes = areaTexto.value.slice(0, caret);
    const despues = areaTexto.value.slice(caret);
    const inicio = antes.length - consulta.length - 1;
    const nuevoAntes = antes.slice(0, inicio) + "@" + nombre + " ";

    areaTexto.value = nuevoAntes + despues;
    areaTexto.selectionStart = areaTexto.selectionEnd = nuevoAntes.length;
    areaTexto.dispatchEvent(new Event("input", { bubbles: true }));
    areaTexto.focus();
    quitarPanel();
  }

  async function sugerir(areaTexto, consulta) {
    turno += 1;
    const miTurno = turno;

    const { data } = await supabaseClient
      .from("profiles")
      .select("username, avatar_url")
      .ilike("username", escaparLike(consulta) + "%")
      .order("username", { ascending: true })
      .limit(5);

    if (miTurno !== turno) return;
    quitarPanel();
    if (!data || data.length === 0) return;
    if (document.activeElement !== areaTexto) return;

    const panel = document.createElement("div");
    panel.className = "yw-sugerencias";

    data.forEach(function (perfil) {
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "yw-sugerencia";

      const avatar = document.createElement("span");
      avatar.className = "yw-sug-avatar";
      avatar.textContent = perfil.username.charAt(0).toUpperCase();
      if (perfil.avatar_url) {
        avatar.textContent = "";
        avatar.style.backgroundImage = 'url("' + perfil.avatar_url + '")';
      }

      const nombre = document.createElement("span");
      nombre.textContent = "@" + perfil.username;

      boton.appendChild(avatar);
      boton.appendChild(nombre);

      boton.addEventListener("mousedown", function (evento) {
        evento.preventDefault();
      });
      boton.addEventListener("click", function () {
        elegir(areaTexto, consulta, perfil.username);
      });

      panel.appendChild(boton);
    });

    areaTexto.insertAdjacentElement("afterend", panel);
    panelActual = panel;
  }

  document.addEventListener("input", function (evento) {
    const areaTexto = evento.target;
    if (!areaTexto || areaTexto.tagName !== "TEXTAREA") return;
    if (EXCLUIDOS.indexOf(areaTexto.id) !== -1) return;

    const antes = areaTexto.value.slice(0, areaTexto.selectionStart);
    const coincidencia = antes.match(/(^|[^A-Za-z0-9_])@([A-Za-z0-9_]{1,20})$/);

    clearTimeout(temporizador);

    if (!coincidencia) {
      turno += 1;
      quitarPanel();
      return;
    }

    temporizador = setTimeout(function () {
      sugerir(areaTexto, coincidencia[2]);
    }, 200);
  });

  document.addEventListener("focusout", function (evento) {
    if (evento.target && evento.target.tagName === "TEXTAREA") {
      setTimeout(quitarPanel, 150);
    }
  });
})();
