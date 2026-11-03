(function () {
  const CASOS = [
    { mensaje: "mensaje", titulo: "titulo", tipo: "tipo" },
    { mensaje: "mensaje-compositor", titulo: "rec-titulo", tipo: "rec-tipo" }
  ];

  CASOS.forEach(function (caso) {
    const mensaje = document.getElementById(caso.mensaje);
    if (!mensaje) return;

    let revisando = false;

    function mostrarExistente(existente) {
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
    }

    async function revisar() {
      const texto = mensaje.textContent || "";
      const porTitulo = texto.indexOf("recomendaciones_titulo_unico") !== -1;
      const porAniList = texto.indexOf("recomendaciones_anilist_unico") !== -1;
      if (revisando || (!porTitulo && !porAniList)) return;
      revisando = true;

      let existente = null;
      try {
        if (porAniList && window.YW && window.YW.anilistActual) {
          const { data } = await supabaseClient
            .from("recomendaciones")
            .select("id, titulo, autor")
            .eq("anilist_id", window.YW.anilistActual)
            .limit(1);
          existente = data && data.length > 0 ? data[0] : null;
        } else {
          const campoTitulo = document.getElementById(caso.titulo);
          const campoTipo = document.getElementById(caso.tipo);
          const enEdicion = window.location.pathname.indexOf("editar-recomendacion") !== -1;
          const idEditado = enEdicion ? new URLSearchParams(window.location.search).get("id") : null;

          const { data } = await supabaseClient.rpc("buscar_recomendacion_igual", {
            p_titulo: campoTitulo ? campoTitulo.value : "",
            p_tipo: campoTipo && campoTipo.value ? campoTipo.value : null,
            p_excluir: idEditado
          });
          existente = data && data.length > 0 ? data[0] : null;
        }
      } catch (error) {
        console.error(error);
      }

      mostrarExistente(existente);
      revisando = false;
    }

    new MutationObserver(revisar).observe(mensaje, {
      childList: true,
      characterData: true,
      subtree: true
    });
  });
})();
