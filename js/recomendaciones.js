function crearTarjeta(rec) {
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
  cuerpo.appendChild(sinopsis);
  cuerpo.appendChild(generos);
  cuerpo.appendChild(pie);
  tarjeta.appendChild(imagen);
  tarjeta.appendChild(cuerpo);

  return tarjeta;
}

async function cargarRecomendaciones() {
  const lista = document.getElementById("lista-recomendaciones");

  const { data, error } = await supabaseClient
    .from("recomendaciones")
    .select("id, titulo, autor, sinopsis, generos, portada_url, created_at, profiles(username)")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    lista.textContent = "No se pudieron cargar las recomendaciones.";
    return;
  }

  if (data.length === 0) {
    lista.textContent = "Todavía no hay recomendaciones. ¡Publicá la primera!";
    return;
  }

  lista.textContent = "";
  data.forEach(function (rec) {
    lista.appendChild(crearTarjeta(rec));
  });
}

cargarRecomendaciones();
