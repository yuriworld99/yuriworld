(async function () {
  const botonEditar = document.getElementById("boton-editar-perfil");
  const formulario = document.getElementById("form-editar-perfil");
  const textoDescripcion = document.getElementById("texto-descripcion");
  const archivoAvatar = document.getElementById("archivo-avatar");
  const vistaAvatar = document.getElementById("vista-avatar");
  const archivoBanner = document.getElementById("archivo-banner");
  const vistaBanner = document.getElementById("vista-banner");
  const botonCancelar = document.getElementById("cancelar-edicion");
  const mensaje = document.getElementById("mensaje-edicion");
  const descripcion = document.getElementById("perfil-descripcion");

  if (!botonEditar || !formulario) return;

  const parametros = new URLSearchParams(window.location.search);
  const { data: datosSesion } = await supabaseClient.auth.getSession();
  const sesion = datosSesion.session;
  const perfilId = parametros.get("id") || (sesion ? sesion.user.id : null);
  if (!perfilId) return;

  let { data: perfil, error: errorPerfilInicial } = await supabaseClient
    .from("profiles")
    .select("id, avatar_url, banner_url, descripcion")
    .eq("id", perfilId)
    .maybeSingle();

  if (errorPerfilInicial) {
    const respaldo = await supabaseClient
      .from("profiles")
      .select("id, avatar_url, descripcion")
      .eq("id", perfilId)
      .maybeSingle();
    perfil = respaldo.data;
  }

  if (!perfil) return;

  if (perfil.descripcion) {
    descripcion.textContent = perfil.descripcion;
    descripcion.hidden = false;
  }

  if (!sesion || sesion.user.id !== perfil.id) return;

  let avatarNuevo = null;
  let bannerNuevo = null;

  function mostrarMensaje(texto, tipo) {
    mensaje.textContent = texto;
    mensaje.className = "muro-mensaje " + tipo;
  }

  function recortar(archivo, anchoFinal, altoFinal, calidad) {
    return new Promise(function (resolver, rechazar) {
      const direccion = URL.createObjectURL(archivo);
      const imagen = new Image();
      imagen.onload = function () {
        URL.revokeObjectURL(direccion);
        const proporcion = anchoFinal / altoFinal;
        let anchoOrigen = imagen.width;
        let altoOrigen = imagen.height;
        if (anchoOrigen / altoOrigen > proporcion) {
          anchoOrigen = altoOrigen * proporcion;
        } else {
          altoOrigen = anchoOrigen / proporcion;
        }
        const origenX = (imagen.width - anchoOrigen) / 2;
        const origenY = (imagen.height - altoOrigen) / 2;
        const lienzo = document.createElement("canvas");
        lienzo.width = anchoFinal;
        lienzo.height = altoFinal;
        const contexto = lienzo.getContext("2d");
        contexto.fillStyle = "#ffffff";
        contexto.fillRect(0, 0, anchoFinal, altoFinal);
        contexto.drawImage(
          imagen,
          origenX,
          origenY,
          anchoOrigen,
          altoOrigen,
          0,
          0,
          anchoFinal,
          altoFinal
        );
        lienzo.toBlob(function (blob) {
          if (blob) resolver(blob);
          else rechazar(new Error("No se pudo procesar la imagen."));
        }, "image/jpeg", calidad);
      };
      imagen.onerror = function () {
        URL.revokeObjectURL(direccion);
        rechazar(new Error("No se pudo leer la imagen."));
      };
      imagen.src = direccion;
    });
  }

  async function subir(bucket, blob, rutas) {
    const ruta = sesion.user.id + "/" + Date.now() + "-" + Math.random().toString(36).slice(2, 7) + ".jpg";
    const { error } = await supabaseClient.storage
      .from(bucket)
      .upload(ruta, blob, { contentType: "image/jpeg" });
    if (error) throw error;
    rutas.push({ bucket: bucket, ruta: ruta });
    return supabaseClient.storage.from(bucket).getPublicUrl(ruta).data.publicUrl;
  }

  async function borrarAnterior(bucket, direccion) {
    if (!direccion) return;
    const partes = direccion.split("/" + bucket + "/");
    if (partes.length !== 2) return;
    await supabaseClient.storage.from(bucket).remove([decodeURIComponent(partes[1])]);
  }

  function cerrarEdicion() {
    formulario.hidden = true;
    botonEditar.hidden = false;
    archivoAvatar.value = "";
    archivoBanner.value = "";
    vistaAvatar.hidden = true;
    vistaBanner.hidden = true;
    avatarNuevo = null;
    bannerNuevo = null;
    mostrarMensaje("", "");
  }

  botonEditar.hidden = false;

  botonEditar.addEventListener("click", function () {
    textoDescripcion.value = perfil.descripcion || "";
    formulario.hidden = false;
    botonEditar.hidden = true;
  });

  botonCancelar.addEventListener("click", cerrarEdicion);

  archivoAvatar.addEventListener("change", async function () {
    const archivo = archivoAvatar.files[0];
    if (!archivo) {
      avatarNuevo = null;
      vistaAvatar.hidden = true;
      return;
    }
    if (!archivo.type.startsWith("image/")) {
      mostrarMensaje("El archivo tiene que ser una imagen.", "error");
      archivoAvatar.value = "";
      return;
    }
    try {
      avatarNuevo = await recortar(archivo, 256, 256, 0.9);
      vistaAvatar.src = URL.createObjectURL(avatarNuevo);
      vistaAvatar.hidden = false;
      mostrarMensaje("", "");
    } catch (error) {
      avatarNuevo = null;
      vistaAvatar.hidden = true;
      mostrarMensaje(error.message, "error");
    }
  });

  archivoBanner.addEventListener("change", async function () {
    const archivo = archivoBanner.files[0];
    if (!archivo) {
      bannerNuevo = null;
      vistaBanner.hidden = true;
      return;
    }
    if (!archivo.type.startsWith("image/")) {
      mostrarMensaje("El archivo tiene que ser una imagen.", "error");
      archivoBanner.value = "";
      return;
    }
    try {
      bannerNuevo = await recortar(archivo, 1500, 500, 0.85);
      if (bannerNuevo.size > 2 * 1024 * 1024) {
        throw new Error("El banner pesa más de 2 MB. Elegí otra imagen.");
      }
      vistaBanner.src = URL.createObjectURL(bannerNuevo);
      vistaBanner.hidden = false;
      mostrarMensaje("", "");
    } catch (error) {
      bannerNuevo = null;
      vistaBanner.hidden = true;
      mostrarMensaje(error.message, "error");
    }
  });

  formulario.addEventListener("submit", async function (evento) {
    evento.preventDefault();

    const botonGuardar = formulario.querySelector('button[type="submit"]');
    botonGuardar.disabled = true;
    mostrarMensaje("Guardando...", "");

    const texto = textoDescripcion.value.trim();
    let urlAvatar = perfil.avatar_url;
    let urlBanner = perfil.banner_url || null;
    const subidos = [];

    try {
      if (avatarNuevo) {
        urlAvatar = await subir("avatares", avatarNuevo, subidos);
      }
      if (bannerNuevo) {
        urlBanner = await subir("banners", bannerNuevo, subidos);
      }

      const cambios = { avatar_url: urlAvatar, descripcion: texto || null };
      if (bannerNuevo) {
        cambios.banner_url = urlBanner;
      }

      const { error: errorPerfil } = await supabaseClient
        .from("profiles")
        .update(cambios)
        .eq("id", sesion.user.id);
      if (errorPerfil) throw errorPerfil;
    } catch (error) {
      for (const subido of subidos) {
        await supabaseClient.storage.from(subido.bucket).remove([subido.ruta]);
      }
      mostrarMensaje("No se pudo guardar: " + (error.message || "error desconocido"), "error");
      botonGuardar.disabled = false;
      return;
    }

    if (avatarNuevo) {
      await borrarAnterior("avatares", perfil.avatar_url);
    }
    if (bannerNuevo) {
      await borrarAnterior("banners", perfil.banner_url);
    }

    window.location.reload();
  });
})();
