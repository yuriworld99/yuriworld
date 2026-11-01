(async function () {
  const generos = document.getElementById("detalle-generos");
  const id = new URLSearchParams(window.location.search).get("id");
  if (!generos || !id) return;
  if (document.querySelector(".bib-caja")) return;

  if (!document.querySelector('link[href^="css/biblioteca.css"]')) {
    const enlaceCss = document.createElement("link");
    enlaceCss.rel = "stylesheet";
    enlaceCss.href = "css/biblioteca.css?v=1";
    document.head.appendChild(enlaceCss);
  }

  const ESTADOS = [
    ["quiero_leer", "Quiero leer"],
    ["leyendo", "Leyendo"],
    ["completada", "Completada"],
    ["abandonada", "Abandonada"]
  ];

  const caja = document.createElement("section");
  caja.className = "bib-caja";

  const titulo = document.createElement("h3");
  titulo.textContent = "Mi biblioteca";

  const texto = document.createElement("p");
  const botones = document.createElement("div");
  botones.className = "bib-botones";

  caja.appendChild(titulo);
  caja.appendChild(texto);
  caja.appendChild(botones);
  generos.insertAdjacentElement("afterend", caja);

  const { data: datosSesion } = await supabaseClient.auth.getSession();
  const sesion = datosSesion.session;

  if (!sesion) {
    texto.innerHTML =
      '<a href="iniciar-sesion.html">Iniciá sesión</a> para guardar esta obra en tu biblioteca.';
    return;
  }

  let actual = null;

  const { data: fila } = await supabaseClient
    .from("biblioteca")
    .select("estado")
    .eq("recomendacion_id", id)
    .eq("user_id", sesion.user.id)
    .maybeSingle();

  actual = fila ? fila.estado : null;

  function pintar() {
    texto.textContent = actual
      ? "Esta obra está en tu biblioteca. Tocá el mismo estado otra vez para quitarla."
      : "Guardala para llevar el registro de tus lecturas.";

    botones.querySelectorAll("button").forEach(function (boton) {
      boton.classList.toggle("activo", boton.dataset.estado === actual);
    });
  }

  function bloquear(valor) {
    botones.querySelectorAll("button").forEach(function (boton) {
      boton.disabled = valor;
    });
  }

  ESTADOS.forEach(function (par) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "bib-btn";
    boton.dataset.estado = par[0];
    boton.textContent = par[1];

    boton.addEventListener("click", async function () {
      bloquear(true);

      try {
        if (actual === par[0]) {
          const { error } = await supabaseClient
            .from("biblioteca")
            .delete()
            .eq("recomendacion_id", id)
            .eq("user_id", sesion.user.id);
          if (error) throw error;
          actual = null;
        } else {
          const { error } = await supabaseClient.from("biblioteca").upsert(
            {
              user_id: sesion.user.id,
              recomendacion_id: id,
              estado: par[0],
              updated_at: new Date().toISOString()
            },
            { onConflict: "user_id,recomendacion_id" }
          );
          if (error) throw error;
          actual = par[0];
        }
      } catch (error) {
        console.error("Error en la biblioteca:", error);
        alert("No se pudo guardar. Probá de nuevo.");
      }

      bloquear(false);
      pintar();
    });

    botones.appendChild(boton);
  });

  pintar();
})();
