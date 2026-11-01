(async function () {
  const titulo = document.getElementById("bib-titulo");
  const sub = document.getElementById("bib-sub");
  const nav = document.getElementById("bib-estados");
  const lista = document.getElementById("bib-lista");
  const volver = document.getElementById("bib-volver");

  const PESTANAS = [
    ["todas", "Todas"],
    ["leyendo", "Leyendo"],
    ["quiero_leer", "Quiero leer"],
    ["completada", "Completadas"],
    ["abandonada", "Abandonadas"]
  ];
  const ETIQUETAS = {
    leyendo: "Leyendo",
    quiero_leer: "Quiero leer",
    completada: "Completada",
    abandonada: "Abandonada"
  };

  let filas = [];
  let activa = "todas";
  let esMia = false;

  function mensaje(texto) {
    const parrafo = document.createElement("p");
    parrafo.className = "ex-vacio";
    parrafo.textContent = texto;
    return parrafo;
  }

  const { data: datosSesion } = await supabaseClient.auth.getSession();
  const miId = datosSesion.session ? datosSesion.session.user.id : null;

  let id = new URLSearchParams(window.location.search).get("id");
  if (!id) id = miId;

  if (!id) {
    lista.replaceChildren(mensaje("Iniciá sesión para ver tu biblioteca."));
    return;
  }

  esMia = id === miId;
  volver.href = "perfil.html?id=" + encodeURIComponent(id);

  const { data: perfil } = await supabaseClient
    .from("profiles")
    .select("username")
    .eq("id", id)
    .maybeSingle();

  if (!perfil) {
    lista.replaceChildren(mensaje("No se encontró el perfil."));
    return;
  }

  titulo.textContent = "Biblioteca de @" + perfil.username;

  const { data, error } = await supabaseClient
    .from("biblioteca")
    .select("estado, updated_at, recomendaciones(id, titulo, autor, portada_url)")
    .eq("user_id", id)
    .order("updated_at", { ascending: false })
    .limit(500);

  if (error) {
    lista.replaceChildren(mensaje("No se pudo cargar la biblioteca. Probá de nuevo."));
    return;
  }

  filas = (data || []).filter(function (fila) {
    return fila.recomendaciones;
  });

  function contar(estado) {
    if (estado === "todas") return filas.length;
    return filas.filter(function (fila) {
      return fila.estado === estado;
    }).length;
  }

  function crearFila(fila) {
    const rec = fila.recomendaciones;

    const enlace = document.createElement("a");
    enlace.className = "ex-obra";
    enlace.href = "recomendacion.html?id=" + encodeURIComponent(rec.id);

    const portada = document.createElement("img");
    portada.className = "ex-portada";
    portada.src = rec.portada_url;
    portada.alt = "Portada de " + rec.titulo;
    portada.loading = "lazy";

    const info = document.createElement("div");
    info.className = "ex-info";

    const nombre = document.createElement("p");
    nombre.className = "ex-obra-titulo";
    nombre.textContent = rec.titulo;

    const autor = document.createElement("p");
    autor.className = "ex-obra-datos";
    autor.textContent = "de " + rec.autor;

    const etiqueta = document.createElement("span");
    etiqueta.className = "bib-etiqueta " + fila.estado;
    etiqueta.textContent = ETIQUETAS[fila.estado] || fila.estado;

    info.appendChild(nombre);
    info.appendChild(autor);
    info.appendChild(etiqueta);

    enlace.appendChild(portada);
    enlace.appendChild(info);
    return enlace;
  }

  function pintarPestanas() {
    nav.replaceChildren();
    PESTANAS.forEach(function (par) {
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "bib-btn" + (par[0] === activa ? " activo" : "");
      boton.textContent = par[1] + " (" + contar(par[0]) + ")";
      boton.addEventListener("click", function () {
        activa = par[0];
        pintar();
      });
      nav.appendChild(boton);
    });
  }

  function pintar() {
    pintarPestanas();

    const visibles = filas.filter(function (fila) {
      return activa === "todas" || fila.estado === activa;
    });

    sub.textContent = filas.length + (filas.length === 1 ? " obra guardada" : " obras guardadas");

    if (visibles.length === 0) {
      lista.replaceChildren(
        mensaje(
          filas.length === 0
            ? esMia
              ? "Todavía no guardaste ninguna obra. Abrí una obra y elegí «Quiero leer», «Leyendo», «Completada» o «Abandonada»."
              : "Esta persona todavía no guardó obras."
            : "No hay obras en esta lista."
        )
      );
      return;
    }

    lista.replaceChildren.apply(lista, visibles.map(crearFila));
  }

  pintar();
})();
