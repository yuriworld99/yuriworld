(function () {
  const original = crearRespuesta;

  crearRespuesta = function (respuesta, nombre, padreId, hilo, usuario) {
    const caja = original(respuesta, nombre, padreId, hilo, usuario);
    caja.dataset.id = respuesta.id;
    caja.dataset.autor = respuesta.user_id;
    caja.dataset.nombre = nombre;
    caja.dataset.usuario = usuario || nombre;
    return caja;
  };
})();
