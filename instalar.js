(function () {
  // Si ya está instalada y se abre como app, no se muestra nada.
  const esApp =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;
  if (esApp) return;

  // Se necesita un service worker registrado para poder instalar.
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  }

  function oculto() {
    try {
      return sessionStorage.getItem("yw-instalar-oculto") === "1";
    } catch (error) {
      return false;
    }
  }

  function recordarOculto() {
    try {
      sessionStorage.setItem("yw-instalar-oculto", "1");
    } catch (error) {}
  }

  function crearAviso(texto, textoBoton, alBoton) {
    if (oculto() || document.getElementById("yw-instalar")) return;

    const caja = document.createElement("div");
    caja.id = "yw-instalar";
    caja.style.cssText =
      "position:fixed;left:12px;right:12px;bottom:12px;z-index:9999;" +
      "display:flex;align-items:center;gap:10px;padding:12px 14px;" +
      "background:#1a0f2e;color:#fff;border-radius:16px;" +
      "box-shadow:0 8px 30px rgba(0,0,0,.35);font-family:inherit;";

    const icono = document.createElement("img");
    icono.src = "icon-192.png";
    icono.alt = "";
    icono.style.cssText = "width:40px;height:40px;border-radius:10px;flex:none;";

    const mensaje = document.createElement("span");
    mensaje.textContent = texto;
    mensaje.style.cssText = "flex:1;font-size:.9rem;line-height:1.3;";

    const cerrar = document.createElement("button");
    cerrar.type = "button";
    cerrar.textContent = "Ahora no";
    cerrar.style.cssText =
      "background:none;border:0;color:#cbb8f5;font-size:.85rem;padding:8px;cursor:pointer;";
    cerrar.addEventListener("click", function () {
      recordarOculto();
      caja.remove();
    });

    caja.appendChild(icono);
    caja.appendChild(mensaje);
    caja.appendChild(cerrar);

    if (textoBoton) {
      const boton = document.createElement("button");
      boton.type = "button";
      boton.textContent = textoBoton;
      boton.style.cssText =
        "background:#7b3fe4;border:0;color:#fff;font-weight:700;" +
        "border-radius:999px;padding:9px 16px;font-size:.9rem;cursor:pointer;";
      boton.addEventListener("click", function () {
        alBoton(caja);
      });
      caja.insertBefore(boton, cerrar);
    }

    document.body.appendChild(caja);
  }

  // Android y Chrome
  let evento = null;
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    evento = e;
    crearAviso("Instalá YuriWorld en tu celular", "Instalar", function (caja) {
      if (!evento) return;
      evento.prompt();
      evento.userChoice.then(function () {
        evento = null;
        caja.remove();
      });
    });
  });

  window.addEventListener("appinstalled", function () {
    const caja = document.getElementById("yw-instalar");
    if (caja) caja.remove();
  });

  // iPhone: Safari no tiene botón de instalar, solo se puede explicar cómo.
  const esIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const esSafari = /safari/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
  if (esIOS && esSafari) {
    window.addEventListener("load", function () {
      crearAviso(
        "Para instalar YuriWorld tocá Compartir y después “Agregar a pantalla de inicio”.",
        null,
        null
      );
    });
  }
})();
