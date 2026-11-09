(function () {
  var ENLACE = "https://ko-fi.com/yuriword/goal?g=70";
  var CLAVE = "yw_kofi_visto";
  var SEGUNDOS = 10;

  // Una sola vez por visita: si ya se mostró en esta sesión, no se repite
  try {
    if (sessionStorage.getItem(CLAVE)) return;
  } catch (e) {}

  var estilos =
    ".yw-kofi{position:fixed;left:12px;right:12px;bottom:calc(16px + env(safe-area-inset-bottom,0px));" +
    "max-width:420px;margin:0 auto;z-index:9999;display:flex;align-items:center;gap:10px;" +
    "padding:12px 14px;background:#fff;color:#2b1a4d;border:1px solid #e3d6fb;border-radius:16px;" +
    "box-shadow:0 8px 28px rgba(123,63,228,.22);" +
    "font:600 14px/1.3 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;" +
    "opacity:0;transform:translateY(12px);transition:opacity .3s,transform .3s}" +
    ".yw-kofi.yw-kofi-visible{opacity:1;transform:none}" +
    ".yw-kofi-texto{flex:1;min-width:0}" +
    ".yw-kofi-boton{flex:none;padding:8px 14px;border-radius:999px;" +
    "background:linear-gradient(135deg,#e0529a,#7b3fe4);color:#fff;text-decoration:none;font-weight:700}" +
    ".yw-kofi-cerrar{flex:none;border:0;background:transparent;color:#6a5a8c;font-size:22px;" +
    "line-height:1;padding:4px 6px;cursor:pointer}" +
    "@media (prefers-reduced-motion:reduce){.yw-kofi{transition:none}}";

  function mostrar() {
    try {
      sessionStorage.setItem(CLAVE, "1");
    } catch (e) {}

    var estilo = document.createElement("style");
    estilo.textContent = estilos;
    document.head.appendChild(estilo);

    var barra = document.createElement("div");
    barra.className = "yw-kofi";
    barra.setAttribute("role", "complementary");
    barra.setAttribute("aria-label", "Apoyá YuriWorld en Ko-fi");

    var texto = document.createElement("span");
    texto.className = "yw-kofi-texto";
    texto.textContent = "☕ ¿Te gusta YuriWorld? Apoyá el proyecto 💜";

    var boton = document.createElement("a");
    boton.className = "yw-kofi-boton";
    boton.href = ENLACE;
    boton.target = "_blank";
    boton.rel = "noopener noreferrer";
    boton.textContent = "Ko-fi";

    var cerrarBoton = document.createElement("button");
    cerrarBoton.type = "button";
    cerrarBoton.className = "yw-kofi-cerrar";
    cerrarBoton.setAttribute("aria-label", "Cerrar");
    cerrarBoton.textContent = "×";

    barra.appendChild(texto);
    barra.appendChild(boton);
    barra.appendChild(cerrarBoton);
    document.body.appendChild(barra);

    var temporizador = null;

    function cerrar() {
      clearTimeout(temporizador);
      barra.classList.remove("yw-kofi-visible");
      setTimeout(function () {
        if (barra.parentNode) barra.parentNode.removeChild(barra);
      }, 350);
    }

    cerrarBoton.addEventListener("click", cerrar);

    // Si la persona toca la barra, no se cierra sola
    barra.addEventListener("pointerdown", function () {
      clearTimeout(temporizador);
    });

    requestAnimationFrame(function () {
      barra.classList.add("yw-kofi-visible");
    });

    temporizador = setTimeout(cerrar, SEGUNDOS * 1000);
  }

  function iniciar() {
    setTimeout(mostrar, 1200);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
