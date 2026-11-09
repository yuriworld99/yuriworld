const CACHE = "yuriworld-v1";
const ICONO = self.registration.scope + "icon-192.png";

self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("activate", function (evento) {
  evento.waitUntil(
    caches
      .keys()
      .then(function (nombres) {
        return Promise.all(
          nombres
            .filter(function (nombre) {
              return nombre !== CACHE;
            })
            .map(function (nombre) {
              return caches.delete(nombre);
            })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

// Primero se pide a la red (siempre se ve lo último) y, si no hay conexión,
// se usa la copia guardada. Solo archivos de tu propio sitio: Supabase y las
// imágenes de las portadas no se tocan.
self.addEventListener("fetch", function (evento) {
  const pedido = evento.request;
  if (pedido.method !== "GET") return;

  const url = new URL(pedido.url);
  if (url.origin !== self.location.origin) return;

  evento.respondWith(
    fetch(pedido)
      .then(function (respuesta) {
        if (respuesta && respuesta.ok) {
          const copia = respuesta.clone();
          caches.open(CACHE).then(function (cache) {
            cache.put(pedido, copia);
          });
        }
        return respuesta;
      })
      .catch(function () {
        return caches.match(pedido).then(function (guardada) {
          if (guardada) return guardada;
          if (pedido.mode === "navigate") return caches.match("index.html");
          return Response.error();
        });
      })
  );
});

self.addEventListener("push", function (evento) {
  let datos = {
    titulo: "YuriWorld",
    cuerpo: "Tenés una notificación nueva.",
    url: self.registration.scope + "notificaciones.html"
  };

  try {
    if (evento.data) {
      datos = Object.assign(datos, evento.data.json());
    }
  } catch (error) {
    // Si el aviso no trae datos válidos, se usa el texto por defecto.
  }

  evento.waitUntil(
    self.registration.showNotification(datos.titulo, {
      body: datos.cuerpo,
      icon: ICONO,
      tag: datos.tag || "yuriworld",
      data: { url: datos.url }
    })
  );
});

self.addEventListener("notificationclick", function (evento) {
  evento.notification.close();

  const destino =
    evento.notification.data && evento.notification.data.url
      ? evento.notification.data.url
      : self.registration.scope + "notificaciones.html";

  evento.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (ventanas) {
        for (const ventana of ventanas) {
          if (ventana.url.startsWith(self.registration.scope) && "focus" in ventana) {
            ventana.navigate(destino);
            return ventana.focus();
          }
        }
        return self.clients.openWindow(destino);
      })
  );
});
