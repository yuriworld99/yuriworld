(function () {
  const lista = document.getElementById("lista-recomendaciones");
  if (!lista) return;

  let idsNovelas = new Set();
  let listo = false;
  let revisando = false;

  function quitarNovelasDeLaLista() {
    if (!listo) return;

    lista.querySelectorAll("a.tarjeta").forEach(function (tarjeta) {
      const coincidencia = (tarjeta.getAttribute("href") || "").match(/id=([^&#]+)/);
      if (coincidencia && idsNovelas.has(decodeURIComponent(coincidencia[1]))) {
        tarjeta.remove();
      }
    });

    if (!lista.querySelector("a.tarjeta") && lista.textContent.trim() === "") {
      lista.textContent = "Todavía no hay recomendaciones de manga, manhwa, manhua ni webtoon.";
    }
  }

  new MutationObserver(function () {
    if (revisando) return;
    revisando = true;
    requestAnimationFrame(function () {
      revisando = false;
      quitarNovelasDeLaLista();
    });
  }).observe(lista, { childList: true });

  async function crearSeccion(novelas) {
    const titulo = document.createElement("h2");
    titulo.className = "titulo-seccion";
    titulo.id = "novelas-ligeras";
    titulo.textContent = "Últimas novelas ligeras";

    const contenedor = document.createElement("section");
    contenedor.id = "lista-novelas";
    contenedor.className = "lista-recomendaciones";

    lista.insertAdjacentElement("afterend", titulo);
    titulo.insertAdjacentElement("afterend", contenedor);

    if (novelas.length === 0) {
      contenedor.textContent = "Todavía no hay novelas ligeras. ¡Recomendá la primera!";
      return;
    }

    const ids = novelas.map(function (rec) {
      return rec.id;
    });

    const { data: resumenes } = await supabaseClient
      .from("resumen_calificaciones")
      .select("recomendacion_id, promedio, cantidad")
      .in("recomendacion_id", ids);

    const porRecomendacion = {};
    (resumenes || []).forEach(function (resumen) {
      porRecomendacion[resumen.recomendacion_id] = resumen;
    });

    novelas.forEach(function (rec) {
      contenedor.appendChild(window.crearTarjeta(rec, porRecomendacion[rec.id]));
    });
  }

  async function iniciar() {
    let intentos = 0;
    while (typeof window.crearTarjeta !== "function" && intentos < 100) {
      await new Promise(function (resolver) {
        setTimeout(resolver, 100);
      });
      intentos += 1;
    }
    if (typeof window.crearTarjeta !== "function") return;

    try {
      const { data, error } = await supabaseClient
        .from("recomendaciones")
        .select("id, titulo, autor, sinopsis, generos, portada_url, created_at, profiles!recomendaciones_user_id_fkey(username)")
        .eq("tipo", "novela_ligera")
        .order("created_at", { ascending: false })
        .limit(60);

      if (error) return;

      idsNovelas = new Set(
        data.map(function (rec) {
          return String(rec.id);
        })
      );
      listo = true;
      quitarNovelasDeLaLista();
      await crearSeccion(data.slice(0, 12));
    } catch (error) {
      console.error("No se pudo armar la sección de novelas ligeras:", error);
    }
  }

  iniciar();
})();
