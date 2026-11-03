(function () {
  if (window.location.pathname.indexOf("editar-recomendacion") === -1) return;

  const mensaje = document.getElementById("mensaje");
  const idActual = new URLSearchParams(window.location.search).get("id");
  if (!mensaje || !idActual) return;

  let esAdmin = null;
  let revisando = false;

  async function comprobarAdmin() {
    if (esAdmin !== null) return esAdmin;
    const { data } = await supabaseClient.rpc("es_administrador");
    esAdmin = data === true;
    return esAdmin;
  }

  async function revisar() {
    if (revisando) return;
    if (mensaje.querySelector(".yw-unir")) return;

    const enlace = mensaje.querySelector('a[href*="recomendacion.html?id="]');
    if (!enlace || (mensaje.textContent || "").indexOf("ya fue recomendada") === -1) return;

    revisando = true;
    const admin = await comprobarAdmin();
    if (!admin || mensaje.querySelector(".yw-unir")) {
      revisando = false;
      return;
    }

    const coincidencia = (enlace.getAttribute("href") || "").match(/id=([^&#]+)/);
    const idExistente = coincidencia ? decodeURIComponent(coincidencia[1]) : null;
    const titulo = ((mensaje.textContent || "").match(/«(.+?)»/) || [])[1] || "la obra existente";

    if (!idExistente || idExistente === idActual) {
      revisando = false;
      return;
    }

    const salto = document.createElement("br");
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "boton yw-unir";
    boton.style.marginTop = "10px";
    boton.textContent = "Unir esta recomendación con «" + titulo + "»";

    boton.addEventListener("click", async function () {
      const aviso =
        "Se van a pasar los votos, comentarios, bibliotecas y publicaciones de esta recomendación a «" +
        titulo +
        "», y esta se va a borrar. ¿Continuar?";
      if (!confirm(aviso)) return;

      boton.disabled = true;
      const { error } = await supabaseClient.rpc("unir_recomendaciones", {
        p_conservar: idExistente,
        p_eliminar: idActual
      });

      if (error) {
        boton.disabled = false;
        alert("No se pudo unir: " + error.message);
        return;
      }

      mensaje.textContent = "¡Listo! Las recomendaciones se unieron.";
      mensaje.className = "mensaje ok";
      setTimeout(function () {
        window.location.href = "recomendacion.html?id=" + encodeURIComponent(idExistente);
      }, 1200);
    });

    mensaje.appendChild(salto);
    mensaje.appendChild(boton);
    revisando = false;
  }

  new MutationObserver(revisar).observe(mensaje, {
    childList: true,
    characterData: true,
    subtree: true
  });
})();
