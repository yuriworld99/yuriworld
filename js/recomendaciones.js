const ROTULOS_AUTOR = { videojuegos: "Estudio: ", peliculas: "Dirección: ", fanart: "Arte de " };

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
  autor.textContent = (ROTULOS_AUTOR[rec.seccion] || "de ") + rec.autor;

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

function crearTarjetaFanart(rec) {
  const enlace = document.createElement("a");
  enlace.className = "fanart-item";
  enlace.href = "recomendacion.html?id=" + encodeURIComponent(rec.id);

  const imagen = document.createElement("img");
  imagen.src = rec.portada_url;
  imagen.alt = rec.titulo;
  imagen.loading = "lazy";
  enlace.appendChild(imagen);

  if (rec.es_18) {
    const marca = document.createElement("span");
    marca.className = "fanart-mas18";
    marca.textContent = "+18";
    enlace.appendChild(marca);
  }

  const pie = document.createElement("div");
  pie.className = "fanart-pie";
  const titulo = document.createElement("strong");
  titulo.textContent = rec.titulo;
  const artista = document.createElement("span");
  artista.textContent = "por " + rec.autor;
  pie.appendChild(titulo);
  pie.appendChild(artista);
  enlace.appendChild(pie);

  return enlace;
}

let pedidoLista = 0;

async function cargarRecomendaciones(seccion) {
  const nombreSeccion = seccion || "lecturas";
  const miPedido = ++pedidoLista;
  const lista = document.getElementById("lista-recomendaciones");

  lista.classList.toggle("modo-fanart", nombreSeccion === "fanart");
  lista.textContent = "Cargando recomendaciones...";

  const { data, error } = await supabaseClient
    .from("recomendaciones")
    .select("id, titulo, autor, sinopsis, generos, portada_url, created_at, seccion, es_18, profiles!recomendaciones_user_id_fkey(username)")
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
    lista.appendChild(
      nombreSeccion === "fanart"
        ? crearTarjetaFanart(rec)
        : crearTarjeta(rec, porRecomendacion[rec.id])
    );
  });
}


const SECCIONES_INICIO = [
  { valor: "lecturas", etiqueta: "Lecturas" },
  { valor: "videojuegos", etiqueta: "Videojuegos" },
  { valor: "peliculas", etiqueta: "Películas" },
  { valor: "oneshot", etiqueta: "OneShot" },
  { valor: "doujin", etiqueta: "Doujin" },
  { valor: "fanart", etiqueta: "Fanart" }
];

function armarPestanasInicio() {
  const lista = document.getElementById("lista-recomendaciones");
  if (!lista || document.querySelector(".sec-pestanas")) return;

  const titulo = document.getElementById("recomendaciones");
  const textoTituloInicial = titulo ? titulo.textContent : "";

  const nav = document.createElement("nav");
  nav.className = "sec-pestanas";
  nav.setAttribute("aria-label", "Secciones");

  SECCIONES_INICIO.forEach(function (seccion) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "sec-pestana" + (seccion.valor === "lecturas" ? " activa" : "");
    boton.dataset.seccion = seccion.valor;
    boton.textContent = seccion.etiqueta;
    nav.appendChild(boton);
  });

  lista.insertAdjacentElement("beforebegin", nav);
  document.body.dataset.seccion = "lecturas";

  nav.addEventListener("click", function (evento) {
    const boton = evento.target.closest(".sec-pestana");
    if (!boton || boton.classList.contains("activa")) return;

    const valor = boton.dataset.seccion;
    document.body.dataset.seccion = valor;

    nav.querySelectorAll(".sec-pestana").forEach(function (otro) {
      otro.classList.toggle("activa", otro === boton);
    });

    if (titulo) {
      titulo.textContent =
        valor === "lecturas" ? textoTituloInicial : "Últimos en " + boton.textContent;
    }

    cargarRecomendaciones(valor);
  });
}

armarPestanasInicio();
cargarRecomendaciones("lecturas");
  
