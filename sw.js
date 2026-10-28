const ICONO =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABAAgMAAADXB5lNAAAADFBMVEX///97P+T/X6IAAACYnb7IAAAA6klEQVR42t2SMa7CMBBE3y6md0F6juIj5Ej/PiDEEXwU+lC4j4V/kWB7FSJRs4WlGe3OzG4iwBBYqlxB4fjGyAgKI7WOoAhdBZRTT5xQQk8I2sNhBNdJSICgrhEOgu9HPHjUY8qpCYGzLgAaLJZtx0diulxhvvxBXgi/HSmQeEBaiDV+hlhFI5ES53Vk3dhP92abihEN7d1J6sl5VVKqrzO7lGRGpC1QRaPdJVTvvQP5mn+vw9Ub7HVIveOXn+FHCBnsb1i+0EgW521HtjhpsUT84BJNDJRnTzxRjEhE4d7wDAd4Tee3wg3+AQtjMHSVdPdNAAAAAElFTkSuQmCC";

self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("activate", function (evento) {
  evento.waitUntil(self.clients.claim());
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
