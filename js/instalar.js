(function () {
  const esApp =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;
  if (esApp) {
    try {
      localStorage.setItem("yw-instalada", "1");
    } catch (error) {}
    return;
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  }

  let evento = window.__ywInstalar || null;
  if (evento) {
    try {
      localStorage.removeItem("yw-instalada");
    } catch (error) {}
  }

  const esIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const esSafari =
    /safari/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);

  function yaInstalada() {
    try {
      return localStorage.getItem("yw-instalada") === "1";
    } catch (error) {
      return false;
    }
  }

  function quitar() {
    const boton = document.getElementById("yw-instalar");
    if (boton) boton.remove();
  }

  function debeMostrar() {
    if (evento) return true;
    if (yaInstalada()) return false;
    return esIOS && esSafari;
  }

  // Devuelve true cuando terminó (se puso el botón o no hace falta).
  function colocar() {
    if (document.getElementById("yw-instalar")) return true;
    if (!debeMostrar()) return true;

    const logo = document.querySelector(".cabecera .logo");
    if (!logo) return false;

    const boton = document.createElement("button");
    boton.id = "yw-instalar";
    boton.type = "button";
    boton.textContent = "Instalar app";
    boton.style.cssText =
      "margin:0 0 0 10px;background:#fff;color:#7b3fe4;border:0;" +
      "border-radius:999px;padding:6px 14px;font-weight:700;" +
      "font-size:.85rem;cursor:pointer;vertical-align:middle;" +
      "box-shadow:0 2px 8px rgba(0,0,0,.2);";

    boton.addEventListener("click", function () {
      if (evento) {
        evento.prompt();
        evento.userChoice.then(function () {
          evento = null;
          window.__ywInstalar = null;
          quitar();
        });
      } else {
        alert("Para instalar YuriWorld tocá Compartir y después “Agregar a pantalla de inicio”.");
      }
    });

    logo.insertAdjacentElement("afterend", boton);
    return true;
  }

  // La cabecera puede armarse después de cargar la página, así que se reintenta un rato.
  function intentar() {
    let veces = 0;
    const reloj = setInterval(function () {
      veces += 1;
      if (colocar() || veces > 25) clearInterval(reloj);
    }, 300);
  }

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    window.__ywInstalar = e;
    evento = e;
    try {
      localStorage.removeItem("yw-instalada");
    } catch (error) {}
    intentar();
  });

  window.addEventListener("appinstalled", function () {
    try {
      localStorage.setItem("yw-instalada", "1");
    } catch (error) {}
    quitar();
  });

  intentar();
})();
