function crearTarjeta(rec, resumen) {
  const tarjeta = document.createElement("a");
  tarjeta.className = "tarjeta";
  tarjeta.href = "recomendacion.html?id=" + encodeURIComponent(rec.id);
  tarjeta.style.color = "inherit";
  tarjeta.style.textDecoration = "none";

  const imagen = document.createElement("img");
  imagen.src = rec.portada_url;
  imagen.alt = "Portada de " + rec.titulo;
  imagen.loading = "lazy";

  const cuerpo = document.createElement("div");
  cuerpo.className = "tarjeta-cuerpo";

  const titulo = document.createElement("h3");
  titulo.textContent = rec.titulo;

  const autor = document.createElement("p");
  autor.className = "tarjeta-autor";
  autor.textContent = "de " + rec.autor;

  const estrellas = document.createElement("p");
  estrellas.className = "tarjeta-autor";
  estrellas.style.fontWeight = "bold";
  estrellas.style.color = "var(--peligro)";
  if (resumen) {
    estrellas.textContent =
      "★ " + resumen.promedio + " · " + resumen.cantidad +
      (resumen.cantidad === 1 ? " voto" : " votos");
  } else {
    estrellas.textContent = "☆ Sin calificaciones";
  }

  const sinopsis = document.createElement("p");
  sinopsis.className = "tarjeta-sinopsis";
  sinopsis.textContent = rec.sinopsis;

  const generos = document.createElement("div");
  generos.className = "tarjeta-generos";
  rec.generos.forEach(function (genero) {
    const etiqueta = document.createElement("span");
    etiqueta.className = "etiqueta-genero";
    etiqueta.textContent = genero;
    generos.appendChild(etiqueta);
  });

  const pie = document.createElement("p");
  pie.className = "tarjeta-pie";
  const usuario = rec.profiles ? rec.profiles.username : "usuario";
  pie.textContent = "Recomendado por " + usuario;

  cuerpo.appendChild(titulo);
  cuerpo.appendChild(autor);
  cuerpo.appendChild(estrellas);
  cuerpo.appendChild(sinopsis);
  cuerpo.appendChild(generos);
  cuerpo.appendChild(pie);
  tarjeta.appendChild(imagen);
  tarjeta.appendChild(cuerpo);

  return tarjeta;
}

let pedidoLista = 0;

async function cargarRecomendaciones(seccion) {
  const nombreSeccion = seccion || "lecturas";
  const miPedido = ++pedidoLista;
  const lista = document.getElementById("lista-recomendaciones");

  lista.textContent = "Cargando recomendaciones...";

  const { data, error } = await supabaseClient
    .from("recomendaciones")
    .select("id, titulo, autor, sinopsis, generos, portada_url, created_at, profiles!recomendaciones_user_id_fkey(username)")
    .eq("seccion", nombreSeccion)
    .order("created_at", { ascending: false })
    .limit(30);

  if (miPedido !== pedidoLista) return;

  if (error) {
    lista.textContent = "No se pudieron cargar las recomendaciones.";
    return;
  }

  if (data.length === 0) {
    lista.textContent =
      nombreSeccion === "lecturas"
        ? "Todavía no hay recomendaciones. ¡Publicá la primera!"
        : "Todavía no hay nada en esta sección. ¡Publicá lo primero!";
    return;
  }

  const ids = data.map(function (rec) {
    return rec.id;
  });

  const { data: resumenes } = await supabaseClient
    .from("resumen_calificaciones")
    .select("recomendacion_id, promedio, cantidad")
    .in("recomendacion_id", ids);

  if (miPedido !== pedidoLista) return;

  const porRecomendacion = {};
  (resumenes || []).forEach(function (resumen) {
    porRecomendacion[resumen.recomendacion_id] = resumen;
  });

  lista.textContent = "";
  data.forEach(function (rec) {
    lista.appendChild(crearTarjeta(rec, porRecomendacion[rec.id]));
  });
}

cargarRecomendaciones("lecturas");
  
