(function () {
  if (!/notificaciones\.html$/.test(window.location.pathname)) return;

  const FUNCION = "https://ifgattjcckprijvpfypw.supabase.co/functions/v1/push";

  function agregarEstilos(ruta) {
    const base = ruta.split("?")[0];
    if (document.querySelector('link[href^="' + base + '"]')) return;
    const enlace = document.createElement("link");
    enlace.rel = "stylesheet";
    enlace.href = ruta;
    document.head.appendChild(enlace);
  }

  agregarEstilos("css/push.css?v=1");

  function convertirClave(base64) {
    const relleno = "=".repeat((4 - (base64.length % 4)) % 4);
    const limpia = (base64 + relleno).replace(/-/g, "+").replace(/_/g, "/");
    const crudo = window.atob(limpia);
    const bytes = new Uint8Array(crudo.length);
    for (let i = 0; i < crudo.length; i++) {
      bytes[i] = crudo.charCodeAt(i);
    }
    return bytes;
  }

  async function iniciar() {
    const { data: datosSesion } = await supabaseClient.auth.getSession();
    const sesion = datosSesion.session;
    if (!sesion) return;

    const cabecera = document.querySelector(".nx-cabecera");
    if (!cabecera) return;

    const zona = document.createElement("section");
    zona.className = "push-zona";
    cabecera.insertAdjacentElement("afterend", zona);

    function mostrar(mensaje, botones) {
      const caja = document.createElement("div");
      caja.className = "push-caja";

      const texto = document.createElement("p");
      texto.className = "push-texto";
      texto.textContent = mensaje;
      caja.appendChild(texto);

      botones.forEach(function (definicion) {
        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = "push-boton" + (definicion.suave ? " suave" : "");
        boton.textContent = definicion.texto;
        boton.addEventListener("click", async function () {
          boton.disabled = true;
          await definicion.accion();
          boton.disabled = false;
        });
        caja.appendChild(boton);
      });

      zona.replaceChildren(caja);
    }

    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      mostrar("Este navegador no admite avisos en el celular.", []);
      return;
    }

    let registro;
    try {
      registro = await navigator.serviceWorker.register("sw.js");
      await navigator.serviceWorker.ready;
    } catch (error) {
      mostrar("No se pudieron preparar los avisos en este navegador.", []);
      return;
    }

    async function activar() {
      const permiso = await Notification.requestPermission();
      if (permiso !== "granted") {
        await pintar();
        return;
      }

      try {
        const respuesta = await fetch(FUNCION);
        const datos = await respuesta.json();
        if (!datos.clave) throw new Error("Sin clave");

        const anterior = await registro.pushManager.getSubscription();
        if (anterior) await anterior.unsubscribe();

        const suscripcion = await registro.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertirClave(datos.clave)
        });

        const json = suscripcion.toJSON();
        const { error } = await supabaseClient.from("suscripciones_push").insert({
          endpoint: json.endpoint,
          p256dh: json.keys.p256dh,
          auth: json.keys.auth
        });

        if (error) {
          await suscripcion.unsubscribe();
          alert("No se pudieron activar los avisos. Probá de nuevo.");
        }
      } catch (error) {
        alert("No se pudieron activar los avisos. Probá de nuevo.");
      }

      await pintar();
    }

    async function desactivar() {
      const suscripcion = await registro.pushManager.getSubscription();
      if (suscripcion) {
        const direccion = suscripcion.endpoint;
        await suscripcion.unsubscribe();
        await supabaseClient.from("suscripciones_push").delete().eq("endpoint", direccion);
      }
      await pintar();
    }

    async function probar() {
      const { data } = await supabaseClient.auth.getSession();
      if (!data.session) return;

      try {
        const respuesta = await fetch(FUNCION, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + data.session.access_token
          },
          body: JSON.stringify({ accion: "prueba" })
        });
        const resultado = await respuesta.json();
        if (!resultado.enviados) {
          alert("No se pudo enviar el aviso de prueba. Desactivá y volvé a activar los avisos.");
        }
      } catch (error) {
        alert("No se pudo enviar el aviso de prueba.");
      }
    }

    async function pintar() {
      if (Notification.permission === "denied") {
        mostrar(
          "Los avisos están bloqueados para este sitio. Para activarlos, tocá el candado de la barra de direcciones de Chrome → Permisos → Notificaciones → Permitir.",
          []
        );
        return;
      }

      const suscripcion = await registro.pushManager.getSubscription();
      let activa = false;

      if (suscripcion) {
        const { data } = await supabaseClient
          .from("suscripciones_push")
          .select("id")
          .eq("endpoint", suscripcion.endpoint)
          .eq("user_id", sesion.user.id)
          .maybeSingle();
        activa = !!data;
      }

      if (activa) {
        mostrar("Los avisos están activados en este celular.", [
          { texto: "Enviarme un aviso de prueba", accion: probar },
          { texto: "Desactivar", accion: desactivar, suave: true }
        ]);
      } else {
        mostrar("Recibí tus notificaciones en la barra del celular, aunque no tengas YuriWorld abierto.", [
          { texto: "Activar avisos en este celular", accion: activar }
        ]);
      }
    }

    pintar();
  }

  iniciar();
})();
