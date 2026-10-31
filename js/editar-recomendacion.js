(async function () {
  const estadoCarga = document.getElementById("estado-carga");
  const formulario = document.getElementById("form-editar");
  const mensaje = document.getElementById("mensaje");
  const boton = document.getElementById("boton-guardar");
  const enlaceVolver = document.getElementById("enlace-volver");
  const inputPortada = document.getElementById("portada");
  const vistaPrevia = document.getElementById("vista-previa");
  const selectTipo = document.getElementById("tipo");
  const selectEstado = document.getElementById("estado");
  const casilla18 = document.getElementById("es18");
  const listaGeneros = document.getElementById("lista-generos");

  const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];
  const TAMANO_MAXIMO = 2 * 1024 * 1024;

  function mostrarMensaje(texto, tipo) {
    mensaje.textContent = texto;
    mensaje.className = "mensaje " + tipo;
  }

  function rutaDePortada(url) {
    const partes = url ? url.split("/portadas/") : [];
    if (partes.length !== 2) return null;
    return decodeURIComponent(partes[1].split("?")[0]);
  }

  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    estadoCarga.textContent = "No se encontró la recomendación.";
    return;
  }

  enlaceVolver.href = "recomendacion.html?id=" + encodeURIComponent(id);

  if (!window.YW) {
    estadoCarga.textContent = "No se pudo cargar el formulario. Recargá la página.";
    return;
  }

  const { data: datosSesion } = await supabaseClient.auth.getSession();
  const sesion = datosSesion.session;
  if (!sesion) {
    estadoCarga.innerHTML = 'Tenés que <a href="iniciar-sesion.html">iniciar sesión</a> para editar.';
    return;
  }

  const { data: rec, error } = await supabaseClient
    .from("recomendaciones")
    .select("id, user_id, titulo, autor, sinopsis, generos, tipo, estado, es_18, portada_url")
    .eq("id", id)
    .maybeSingle();

  if (error || !rec) {
    estadoCarga.textContent = "No se encontró la recomendación.";
    return;
  }

  if (rec.user_id !== sesion.user.id) {
    estadoCarga.textContent = "Solo podés editar tus propias recomendaciones.";
    return;
  }

  window.YW.llenarSelect(selectTipo, window.YW.TIPOS);
  window.YW.llenarSelect(selectEstado, window.YW.ESTADOS);
  window.YW.llenarGeneros(listaGeneros);

  const conocidos = window.YW.GENEROS.map(function (genero) {
    return genero.valor;
  });
  (rec.generos || []).forEach(function (valor) {
    if (conocidos.includes(valor)) return;
    const etiqueta = document.createElement("label");
    etiqueta.className = "chip";
    const casilla = document.createElement("input");
    casilla.type = "checkbox";
    casilla.name = "genero";
    casilla.value = valor;
    etiqueta.appendChild(casilla);
    etiqueta.appendChild(document.createTextNode(" " + valor));
    listaGeneros.appendChild(etiqueta);
  });

  document.querySelectorAll('input[name="genero"]').forEach(function (casilla) {
    casilla.checked = (rec.generos || []).includes(casilla.value);
  });

  document.getElementById("titulo").value = rec.titulo || "";
  document.getElementById("autor").value = rec.autor || "";
  document.getElementById("sinopsis").value = rec.sinopsis || "";
  selectTipo.value = rec.tipo || "";
  selectEstado.value = rec.estado || "";
  casilla18.checked = !!rec.es_18;

  vistaPrevia.src = rec.portada_url;
  vistaPrevia.hidden = false;

  estadoCarga.hidden = true;
  formulario.hidden = false;

  inputPortada.addEventListener("change", function () {
    const archivo = inputPortada.files[0];
    if (!archivo) {
      vistaPrevia.src = rec.portada_url;
      return;
    }
    vistaPrevia.src = URL.createObjectURL(archivo);
  });

  formulario.addEventListener("submit", async function (evento) {
    evento.preventDefault();

    const titulo = document.getElementById("titulo").value.trim();
    const autor = document.getElementById("autor").value.trim();
    const sinopsis = document.getElementById("sinopsis").value.trim();
    const tipo = selectTipo.value;
    const estado = selectEstado.value;
    const generos = Array.from(
      document.querySelectorAll('input[name="genero"]:checked')
    ).map(function (casilla) {
      return casilla.value;
    });
    const archivo = inputPortada.files[0];

    if (!titulo || !autor || !sinopsis) {
      mostrarMensaje("Completá el título, el autor y la sinopsis.", "error");
      return;
    }
    if (!tipo) {
      mostrarMensaje("Elegí el tipo de obra.", "error");
      return;
    }
    if (!estado) {
      mostrarMensaje("Elegí el estado: en emisión o finalizado.", "error");
      return;
    }
    if (generos.length === 0) {
      mostrarMensaje("Elegí al menos un género.", "error");
      return;
    }
    if (archivo) {
      if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
        mostrarMensaje("La portada tiene que ser JPG, PNG o WEBP.", "error");
        return;
      }
      if (archivo.size > TAMANO_MAXIMO) {
        mostrarMensaje("La portada pesa más de 2 MB. Elegí una imagen más liviana.", "error");
        return;
      }
    }

    boton.disabled = true;
    mostrarMensaje("Guardando...", "");

    const cambios = {
      titulo: titulo,
      autor: autor,
      sinopsis: sinopsis,
      generos: generos,
      tipo: tipo,
      estado: estado,
      es_18: casilla18.checked
    };

    let rutaNueva = null;

    if (archivo) {
      let extension = "jpg";
      if (archivo.type === "image/png") extension = "png";
      if (archivo.type === "image/webp") extension = "webp";
      rutaNueva = sesion.user.id + "/" + Date.now() + "." + extension;

      const { error: errorSubida } = await supabaseClient.storage
        .from("portadas")
        .upload(rutaNueva, archivo);

      if (errorSubida) {
        mostrarMensaje("No se pudo subir la portada: " + errorSubida.message, "error");
        boton.disabled = false;
        return;
      }

      const { data: datosUrl } = supabaseClient.storage
        .from("portadas")
        .getPublicUrl(rutaNueva);
      cambios.portada_url = datosUrl.publicUrl;
    }

    const { data: filas, error: errorGuardar } = await supabaseClient
      .from("recomendaciones")
      .update(cambios)
      .eq("id", rec.id)
      .select("id");

    if (errorGuardar || !filas || filas.length === 0) {
      if (rutaNueva) {
        await supabaseClient.storage.from("portadas").remove([rutaNueva]);
      }
      mostrarMensaje(
        "No se pudieron guardar los cambios" +
          (errorGuardar ? ": " + errorGuardar.message : "."),
        "error"
      );
      boton.disabled = false;
      return;
    }

    if (rutaNueva) {
      const rutaVieja = rutaDePortada(rec.portada_url);
      if (rutaVieja) {
        const { count } = await supabaseClient
          .from("publicaciones")
          .select("id", { count: "exact", head: true })
          .eq("rec_portada_url", rec.portada_url);
        if (!count) {
          await supabaseClient.storage.from("portadas").remove([rutaVieja]);
        }
      }
      rec.portada_url = cambios.portada_url;
    }

    mostrarMensaje("¡Cambios guardados! 💜", "ok");
    setTimeout(function () {
      window.location.href = "recomendacion.html?id=" + encodeURIComponent(rec.id);
    }, 1200);
  });
})();
