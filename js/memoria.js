/* Recuerda dónde estabas (posición y estado) para cuando vuelvas atrás. */
(function () {
  "use strict";

  const PREFIJO = "yw_mem_";
  const VIGENCIA_MS = 30 * 60 * 1000;
  const scriptActual = document.currentScript;

  function volvioConAtras() {
    try {
      const navegacion = performance.getEntriesByType("navigation")[0];
      if (navegacion) return navegacion.type === "back_forward";
      return !!(performance.navigation && performance.navigation.type === 2);
    } catch (error) {
      return false;
    }
  }

  function guardar(nombre, estado) {
    try {
      sessionStorage.setItem(
        PREFIJO + nombre,
        JSON.stringify(Object.assign({}, estado, { t: Date.now() }))
      );
    } catch (error) {}
  }

  function leerGuardado(nombre) {
    try {
      const crudo = sessionStorage.getItem(PREFIJO + nombre);
      if (!crudo) return null;
      const estado = JSON.parse(crudo);
      if (!estado || Date.now() - estado.t > VIGENCIA_MS) return null;
      return estado;
    } catch (error) {
      return null;
    }
  }

  /* Devuelve lo guardado solo si la persona volvió con el botón "atrás". */
  function leer(nombre) {
    return volvioConAtras() ? leerGuardado(nombre) : null;
  }

  /* Guarda el estado (más la posición) cuando la persona se va de la página. */
  function vigilar(nombre, obtenerEstado) {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";

    function guardarAhora() {
      let extra = {};
      try {
        extra = (obtenerEstado && obtenerEstado()) || {};
      } catch (error) {}
      guardar(nombre, Object.assign({}, extra, { y: Math.round(window.scrollY) }));
    }

    window.addEventListener("pagehide", guardarAhora);
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") guardarAhora();
    });
  }

  /* Vuelve a la posición guardada. Insiste unos segundos porque el contenido termina
     de cargarse y acomodarse después; se detiene si la persona toca la pantalla. */
  function restaurarPosicion(y) {
    const raiz = document.documentElement;
    const comportamientoOriginal = raiz.style.scrollBehavior;
    raiz.style.scrollBehavior = "auto";

    let interactuo = false;
    function parar() {
      interactuo = true;
    }
    ["touchstart", "wheel", "mousedown", "keydown"].forEach(function (nombre) {
      window.addEventListener(nombre, parar, { passive: true, once: true });
    });

    let intentos = 0;
    let estables = 0;

    const reloj = setInterval(function () {
      intentos += 1;
      if (interactuo || intentos > 34) {
        clearInterval(reloj);
        raiz.style.scrollBehavior = comportamientoOriginal;
        return;
      }

      const maximo = Math.max(0, raiz.scrollHeight - window.innerHeight);
      const objetivo = Math.min(y, maximo);
      window.scrollTo(0, objetivo);

      if (Math.abs(window.scrollY - objetivo) <= 2 && objetivo >= y - 2) {
        estables += 1;
      } else {
        estables = 0;
      }

      if (estables >= 8) {
        clearInterval(reloj);
        raiz.style.scrollBehavior = comportamientoOriginal;
      }
    }, 150);
  }

  window.YW_MEMORIA = {
    volvioConAtras: volvioConAtras,
    guardar: guardar,
    leer: leer,
    vigilar: vigilar,
    restaurarPosicion: restaurarPosicion
  };

  /* Modo automático: <script src="js/memoria.js" data-auto="nombre"> recuerda solo la posición. */
  if (scriptActual && scriptActual.dataset && scriptActual.dataset.auto) {
    const nombre = "auto:" + scriptActual.dataset.auto + ":" + window.location.pathname + window.location.search;
    const estado = leer(nombre);
    vigilar(nombre);

    if (estado && estado.y > 0) {
      const empezar = function () {
        restaurarPosicion(estado.y);
      };
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", empezar);
      } else {
        empezar();
      }
    }
  }

  /* Enlaces "← Volver": si hay una página anterior de YuriWorld, vuelven a ella de verdad
     (así conservan la posición y los filtros) y el texto dice a dónde vas. */
  const ETIQUETAS_VOLVER = {
    "index.html": "← Volver al inicio",
    "explorar.html": "← Volver a Explorar",
    "foro.html": "← Volver a la comunidad",
    "perfil.html": "← Volver al perfil",
    "biblioteca.html": "← Volver a la biblioteca",
    "autor.html": "← Volver a las obras del autor",
    "notificaciones.html": "← Volver a las notificaciones",
    "publicacion.html": "← Volver a la publicación",
    "recomendacion.html": "← Volver a la obra anterior"
  };

  function ultimoSegmento(ruta) {
    const segmento = ruta.split("/").filter(Boolean).pop() || "";
    return /\.html$/i.test(segmento) ? segmento : "index.html";
  }

  function volverDesde(enlace, opciones) {
    if (enlace.dataset.ywVolver) return;
    try {
      if (!document.referrer || window.history.length < 2) return;
      const anterior = new URL(document.referrer);
      if (anterior.origin !== window.location.origin || anterior.href === window.location.href) return;
      const paginaAnterior = ultimoSegmento(anterior.pathname);

      if (opciones.cambiarTexto) {
        enlace.textContent = ETIQUETAS_VOLVER[paginaAnterior] || "← Volver";
      }
      enlace.dataset.ywVolver = "1";

      enlace.addEventListener("click", function (evento) {
        if (evento.button > 0 || evento.ctrlKey || evento.metaKey || evento.shiftKey) return;
        if (!opciones.cambiarTexto) {
          // este enlace ya dice a dónde va: solo vuelve atrás si venías de esa misma página
          const destino = new URL(enlace.href, window.location.href);
          if (ultimoSegmento(destino.pathname) !== paginaAnterior) return;
        }
        evento.preventDefault();
        window.history.back();
      });
    } catch (error) {}
  }

  function configurarVolver() {
    document.querySelectorAll("a.enlace-volver").forEach(function (enlace) {
      volverDesde(enlace, { cambiarTexto: true });
    });
    const volverBiblioteca = document.getElementById("bib-volver");
    if (volverBiblioteca) volverDesde(volverBiblioteca, { cambiarTexto: false });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", configurarVolver);
  } else {
    configurarVolver();
  }
})();
    
