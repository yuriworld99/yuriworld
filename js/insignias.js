(function () {
  const TIPOS = {
    manga: "Manga",
    manhwa: "Manhwa",
    manhua: "Manhua",
    webtoon: "Webtoon",
    novela_ligera: "Novela ligera"
  };
  const ESTADOS = { en_emision: "En emisión", finalizado: "Finalizado" };
  const cache = {};
  let pendiente = false;

  function agregarEstilos(ruta) {
    const base = ruta.split("?")[0];
    if (document.querySelector('link[href^="' + base + '"]')) return;
    const enlace = document.createElement("link");
    enlace.rel = "stylesheet";
    enlace.href = ruta;
    document.head.appendChild(enlace);
  }

  agregarEstilos("css/insignias.css?v=3");

  function idDeEnlace(elemento) {
    const direccion = elemento.getAttribute("href") || "";
    const coincidencia = direccion.match(/recomendacion\.html\?id=([^&#]+)/);
    return coincidencia ? decodeURIComponent(coincidencia[1]) : null;
  }

  function crearInsignias(datos) {
    const caja = document.createElement("div");
    caja.className = "yw-insignias";

    function agregar(clase, texto) {
      const insignia = document.createElement("span");
      insignia.className = "yw-ins " + clase;
      insignia.textContent = texto;
      caja.appendChild(insignia);
    }

    if (datos.tipo && TIPOS[datos.tipo]) agregar("tipo-" + datos.tipo, TIPOS[datos.tipo]);
    if (datos.es_18) agregar("mas18", "+18");
    if (datos.estado && ESTADOS[datos.estado]) agregar("estado-" + datos.estado, ESTADOS[datos.estado]);

    return caja.childElementCount > 0 ? caja : null;
  }

  function decorar(elemento, datos) {
    if (elemento.dataset.ywHecho === "1") return;
    elemento.dataset.ywHecho = "1";

    const destino = elemento.classList.contains("tarjeta")
      ? elemento.querySelector(".tarjeta-cuerpo")
      : elemento.querySelector(".ex-info");

    if (!destino || destino.querySelector(".yw-insignias")) return;

    const caja = crearInsignias(datos);
    if (caja) destino.insertBefore(caja, destino.firstChild);
  }

  async function procesar() {
    const elementos = Array.from(
      document.querySelectorAll(
        'a.tarjeta[href*="recomendacion.html?id="], a.ex-obra[href*="recomendacion.html?id="]'
      )
    ).filter(function (elemento) {
      return elemento.dataset.ywHecho !== "1";
    });

    if (elementos.length === 0) return;

    const faltan = [];
    elementos.forEach(function (elemento) {
      const id = idDeEnlace(elemento);
      if (id && !(id in cache) && !faltan.includes(id)) faltan.push(id);
    });

    if (faltan.length > 0) {
      const { data } = await supabaseClient
        .from("recomendaciones")
        .select("id, tipo, estado, es_18")
        .in("id", faltan);

      faltan.forEach(function (id) {
        if (!(id in cache)) cache[id] = null;
      });
      (data || []).forEach(function (fila) {
        cache[fila.id] = fila;
      });
    }

    elementos.forEach(function (elemento) {
      const datos = cache[idDeEnlace(elemento)];
      if (datos) {
        decorar(elemento, datos);
      } else {
        elemento.dataset.ywHecho = "1";
      }
    });
  }

  async function decorarDetalle() {
    const autor = document.getElementById("detalle-autor");
    const id = new URLSearchParams(window.location.search).get("id");
    if (!autor || !id) return;
    if (document.querySelector("#contenido .yw-insignias, #contenido .yw-otros-titulos")) return;

    const { data } = await supabaseClient
      .from("recomendaciones")
      .select("tipo, estado, es_18, titulos_alternativos")
      .eq("id", id)
      .maybeSingle();

    if (!data) return;
    if (document.querySelector("#contenido .yw-insignias, #contenido .yw-otros-titulos")) return;

    let referencia = autor;

    const caja = crearInsignias(data);
    if (caja) {
      caja.style.margin = "6px 0 10px";
      autor.insertAdjacentElement("afterend", caja);
      referencia = caja;
    }

    const otros = data.titulos_alternativos || [];
    if (otros.length > 0) {
      const parrafo = document.createElement("p");
      parrafo.className = "yw-otros-titulos";
      parrafo.style.margin = "0 0 10px";
      parrafo.style.color = "#6d5d7d";
      parrafo.style.fontSize = "0.9rem";
      parrafo.textContent = "También conocida como: " + otros.slice(0, 6).join(" · ");
      referencia.insertAdjacentElement("afterend", parrafo);
    }
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
  decorarDetalle();
})();
