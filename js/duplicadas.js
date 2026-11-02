(function () {
  const CASOS = [
    { mensaje: "mensaje", titulo: "titulo", tipo: "tipo" },
    { mensaje: "mensaje-compositor", titulo: "rec-titulo", tipo: "rec-tipo" }
  ];

  CASOS.forEach(function (caso) {
    const mensaje = document.getElementById(caso.mensaje);
    if (!mensaje) return;

    let revisando = false;

    async function revisar() {
      const texto = mensaje.textContent || "";
      if (revisando || texto.indexOf("recomendaciones_titulo_unico") === -1) return;
      revisando = true;

      const campoTitulo = document.getElementById(caso.titulo);
      const campoTipo = document.getElementById(caso.tipo);
      const enEdicion = window.location.pathname.indexOf("editar-recomendacion") !== -1;
      const idEditado = enEdicion ? new URLSearchParams(window.location.search).get("id") : null;

      let existente = null;
      try {
        const { data } = await supabaseClient.rpc("buscar_recomendacion_igual", {
          p_titulo: campoTitulo ? campoTitulo.value : "",
          p_tipo: campoTipo && campoTipo.value ? campoTipo.value : null,
          p_excluir: idEditado
        });
        existente = data && data.length > 0 ? data[0] : null;
      } catch (error) {
        console.error(error);
      }

      mensaje.textContent = "";
      mensaje.className = mensaje.className.replace(/\bok\b/, "").trim();
      if (mensaje.className.indexOf("error") === -1) mensaje.className += " error";

      if (existente) {
        mensaje.appendChild(
          document.createTextNode("Esta obra ya fue recomendada: «" + existente.titulo + "» de " + existente.autor + ". ")
        );
        const enlace = document.createElement("a");
        enlace.href = "recomendacion.html?id=" + encodeURIComponent(existente.id);
        enlace.textContent = "Verla, calificarla y comentarla";
        mensaje.appendChild(enlace);
      } else {
        mensaje.textContent =
          "Ya existe una recomendación con ese título y ese tipo. Buscala en Explorar → Obras.";
      }

      revisando = false;
    }

    new MutationObserver(revisar).observe(mensaje, {
      childList: true,
      characterData: true,
      subtree: true
    });
  });
})();
