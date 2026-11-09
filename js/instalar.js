(function () {
  const esApp =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;
  if (esApp) return;

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  }

  let evento = window.__ywInstalar || null;

  function oculto() {
    try {
      return sessionStorage.getItem("yw-instalar-oculto") === "1";
    } catch (error) {
      return false;
    }
  }

  function quitar() {
    const caja = document.getElementById("yw-instalar");
    if (caja) caja.remove();
  }

  function mostrar() {
    if (oculto() || document.getElementById("yw-instalar")) return;
    if (!document.body) return;

    const esIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const hayBoton = !!evento;
    const texto = hayBoton
      ? "Instalá YuriWorld en tu celular"
      : esIOS
        ? "Para instalar YuriWorld tocá Compartir y después “Agregar a pantalla de inicio”."
        : "Para instalar YuriWorld tocá los tres puntitos del navegador y elegí “Instalar aplicación”.";

    const caja = document.createElement("div");
    caja.id = "yw-instalar";
    caja.style.cssText =
      "position:fixed;left:12px;right:12px;bottom:12px;z-index:99999;" +
      "display:flex;align-items:center;gap:10px;padding:12px 14px;" +
      "background:#1a0f2e;color:#fff;border-radius:16px;" +
      "box-shadow:0 8px 30px rgba(0,0,0,.35);font-family:inherit;";

    const icono = document.createElement("img");
    icono.src = "icon-192.png";
    icono.alt = "";
    icono.style.cssText = "width:40px;height:40px;border-radius:10px;flex:none;";
    caja.appendChild(icono);

    const mensaje = document.createElement("span");
    mensaje.textContent = texto;
    mensaje.style.cssText = "flex:1;font-size:.9rem;line-height:1.3;";
    caja.appendChild(mensaje);

    if (hayBoton) {
      const boton = document.createElement("button");
      boton.type = "button";
      boton.textContent = "Instalar";
      boton.style.cssText =
        "background:#7b3fe4;border:0;color:#fff;font-weight:700;" +
        "border-radius:999px;padding:9px 16px;font-size:.9rem;cursor:pointer;";
      boton.addEventListener("click", function () {
        if (!evento) return;
        evento.prompt();
        evento.userChoice.then(function () {
          evento = null;
          quitar();
        });
      });
      caja.appendChild(boton);
    }

    const cerrar = document.createElement("button");
    cerrar.type = "button";
    cerrar.textContent = "Ahora no";
    cerrar.style.cssText =
      "background:none;border:0;color:#cbb8f5;font-size:.85rem;padding:8px;cursor:pointer;";
    cerrar.addEventListener("click", function () {
      try {
        sessionStorage.setItem("yw-instalar-oculto", "1");
      } catch (error) {}
      quitar();
    });
    caja.appendChild(cerrar);

    document.body.appendChild(caja);
  }

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    evento = e;
    quitar();
    mostrar();
  });

  window.addEventListener("appinstalled", quitar);

  // Si Chrome ya avisó antes de que este archivo cargara, igual se muestra.
  setTimeout(mostrar, 3000);
})();
