(function () {
  const original = crearRespuesta;

  crearRespuesta = function (respuesta, nombre, padreId, hilo) {
    const caja = original(respuesta, nombre, padreId, hilo);
    caja.dataset.id = respuesta.id;
    caja.dataset.autor = respuesta.user_id;
    caja.dataset.nombre = nombre;
    return caja;
  };
})();
