(async function () {
  const aviso = document.getElementById("aviso");
  const contenido = document.getElementById("contenido");
  const formulario = document.getElementById("form-eliminar");
  const mensaje = document.getElementById("mensaje");
  const boton = document.getElementById("boton-eliminar");

  function mostrar(texto, tipo) {
    mensaje.textContent = texto;
    mensaje.className = "mensaje " + tipo;
  }

  const { data: datosSesion } = await supabaseClient.auth.getSession();
  const sesion = datosSesion.session;

  if (!sesion) {
    aviso.innerHTML = 'Tenés que <a href="iniciar-sesion.html">iniciar sesión</a> para eliminar tu cuenta.';
    return;
  }

  const { data: esAdmin } = await supabaseClient.rpc("es_administrador");
  if (esAdmin === true) {
    aviso.textContent = "Las cuentas administradoras no se pueden eliminar desde la web.";
    return;
  }

  aviso.hidden = true;
  contenido.hidden = false;

  function rutaDeUrl(url) {
    if (!url) return null;
    const marca = "/storage/v1/object/public/";
    const inicio = url.indexOf(marca);
    if (inicio === -1) return null;

    const resto = url.slice(inicio + marca.length).split("?")[0];
    const barra = resto.indexOf("/");
    if (barra === -1) return null;

    return {
      espacio: resto.slice(0, barra),
      ruta: decodeURIComponent(resto.slice(barra + 1))
    };
  }

  async function juntarArchivos() {
    const urls = [];

    const { data: perfil } = await supabaseClient
      .from("profiles")
      .select("avatar_url, banner_url")
      .eq("id", sesion.user.id)
      .maybeSingle();
    if (perfil) {
      urls.push(perfil.avatar_url, perfil.banner_url);
    }

    const { data: recomendaciones } = await supabaseClient
      .from("recomendaciones")
      .select("portada_url")
      .eq("user_id", sesion.user.id);
    (recomendaciones || []).forEach(function (fila) {
      urls.push(fila.portada_url);
    });

    const { data: publicaciones } = await supabaseClient
      .from("publicaciones")
      .select("imagen_url, rec_portada_url")
      .eq("user_id", sesion.user.id);
    (publicaciones || []).forEach(function (fila) {
      urls.push(fila.imagen_url, fila.rec_portada_url);
    });

    return urls;
  }

  async function borrarArchivos(urls) {
    const porEspacio = {};

    urls.forEach(function (url) {
      const datos = rutaDeUrl(url);
      if (!datos) return;
      if (!porEspacio[datos.espacio]) porEspacio[datos.espacio] = [];
      if (!porEspacio[datos.espacio].includes(datos.ruta)) {
        porEspacio[datos.espacio].push(datos.ruta);
      }
    });

    for (const espacio of Object.keys(porEspacio)) {
      try {
        await supabaseClient.storage.from(espacio).remove(porEspacio[espacio]);
      } catch (error) {
        console.error("No se pudieron borrar algunos archivos:", error);
      }
    }
  }

  async function quitarAvisos() {
    try {
      if (!("serviceWorker" in navigator)) return;
      const registro = await navigator.serviceWorker.getRegistration();
      if (!registro) return;
      const suscripcion = await registro.pushManager.getSubscription();
      if (suscripcion) await suscripcion.unsubscribe();
    } catch (error) {
      console.error("No se pudieron quitar los avisos:", error);
    }
  }

  formulario.addEventListener("submit", async function (evento) {
    evento.preventDefault();

    const password = document.getElementById("password").value;
    const palabra = document.getElementById("palabra").value.trim().toUpperCase();

    if (palabra !== "ELIMINAR") {
      mostrar("Escribí la palabra ELIMINAR para confirmar.", "error");
      return;
    }

    if (!confirm("Último aviso: tu cuenta y todo tu contenido se borrarán para siempre. ¿Continuar?")) {
      return;
    }

    boton.disabled = true;
    mostrar("Comprobando tu contraseña...", "");

    const { error: errorClave } = await supabaseClient.auth.signInWithPassword({
      email: sesion.user.email,
      password: password
    });

    if (errorClave) {
      mostrar("La contraseña no es correcta.", "error");
      boton.disabled = false;
      return;
    }

    mostrar("Borrando tus archivos...", "");
    try {
      await borrarArchivos(await juntarArchivos());
    } catch (error) {
      console.error("Error al juntar archivos:", error);
    }

    mostrar("Eliminando tu cuenta...", "");
    const { error } = await supabaseClient.rpc("eliminar_mi_cuenta");

    if (error) {
      console.error("Error al eliminar la cuenta:", error);
      mostrar("No se pudo eliminar la cuenta. Escribinos al correo de contacto y lo resolvemos.", "error");
      boton.disabled = false;
      return;
    }

    await quitarAvisos();
    try {
      await supabaseClient.auth.signOut({ scope: "local" });
    } catch (errorSalida) {
      console.error(errorSalida);
    }

    contenido.hidden = true;
    mostrar("Tu cuenta fue eliminada. Gracias por haber sido parte de YuriWorld 💜", "ok");
    setTimeout(function () {
      window.location.href = "index.html";
    }, 3500);
  });
})();
