const SUPABASE_URL = "https://ifgattjcckprijvpfypw.supabase.co";
const SUPABASE_KEY = "sb_publishable_JG7AQQ_tTJJ6SNKVjU50PQ_VNxlzTim";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const scriptLayout = document.createElement("script");
scriptLayout.src = "js/layout.js?v=2";
document.head.appendChild(scriptLayout);

const scriptAvatares = document.createElement("script");
scriptAvatares.src = "js/avatares.js?v=1";
document.head.appendChild(scriptAvatares);

const scriptDenunciar = document.createElement("script");
scriptDenunciar.src = "js/denunciar.js?v=2";
document.head.appendChild(scriptDenunciar);

const scriptNotificaciones = document.createElement("script");
scriptNotificaciones.src = "js/notificaciones-menu.js?v=1";
document.head.appendChild(scriptNotificaciones);

const scriptMenuAdmin = document.createElement("script");
scriptMenuAdmin.src = "js/menu-admin.js?v=1";
document.head.appendChild(scriptMenuAdmin);

const scriptSeguidores = document.createElement("script");
scriptSeguidores.src = "js/seguidores.js?v=1";
document.head.appendChild(scriptSeguidores);

const scriptSiguiendo = document.createElement("script");
scriptSiguiendo.src = "js/siguiendo.js?v=1";
document.head.appendChild(scriptSiguiendo);

const scriptPush = document.createElement("script");
scriptPush.src = "js/push.js?v=1";
document.head.appendChild(scriptPush);

const scriptNavExplorar = document.createElement("script");
scriptNavExplorar.src = "js/nav-explorar.js?v=1";
document.head.appendChild(scriptNavExplorar);

const scriptLegal = document.createElement("script");
scriptLegal.src = "js/legal.js?v=1";
document.head.appendChild(scriptLegal);

const scriptCuenta = document.createElement("script");
scriptCuenta.src = "js/cuenta.js?v=1";
document.head.appendChild(scriptCuenta);

const scriptInsignias = document.createElement("script");
scriptInsignias.src = "js/insignias.js?v=4";
document.head.appendChild(scriptInsignias);

const scriptSecciones = document.createElement("script");
scriptSecciones.src = "js/inicio-secciones.js?v=1";
document.head.appendChild(scriptSecciones);

const scriptExplorarTipos = document.createElement("script");
scriptExplorarTipos.src = "js/explorar-tipos.js?v=3";
document.head.appendChild(scriptExplorarTipos);

const scriptEditarBoton = document.createElement("script");
scriptEditarBoton.src = "js/editar-rec-boton.js?v=2";
document.head.appendChild(scriptEditarBoton);

const scriptBibliotecaBoton = document.createElement("script");
scriptBibliotecaBoton.src = "js/biblioteca-boton.js?v=1";
document.head.appendChild(scriptBibliotecaBoton);

const scriptBibliotecaEnlaces = document.createElement("script");
scriptBibliotecaEnlaces.src = "js/biblioteca-enlaces.js?v=1";
document.head.appendChild(scriptBibliotecaEnlaces);

const scriptMenciones = document.createElement("script");
scriptMenciones.src = "js/menciones.js?v=1";
document.head.appendChild(scriptMenciones);

const scriptModulos = document.createElement("script");
scriptModulos.src = "js/modulos.js?v=1";
document.head.appendChild(scriptModulos);

const scriptUnir = document.createElement("script");
scriptUnir.src = "js/unir-recomendaciones.js?v=1";
document.head.appendChild(scriptUnir);

const scriptDuplicadas = document.createElement("script");
scriptDuplicadas.src = "js/duplicadas.js?v=2";
document.head.appendChild(scriptDuplicadas);

const scriptGeneros = document.createElement("script");
scriptGeneros.src = "js/generos.js?v=3";
scriptGeneros.onload = function () {
  const scriptAniList = document.createElement("script");
  scriptAniList.src = "js/anilist.js?v=1";
  scriptAniList.onload = function () {
    const scriptRecExtra = document.createElement("script");
    scriptRecExtra.src = "js/rec-extra.js?v=2";
    document.head.appendChild(scriptRecExtra);
  };
  document.head.appendChild(scriptAniList);
};
document.head.appendChild(scriptGeneros);
(function () {
  document
    .querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]')
    .forEach(function (enlace) {
      enlace.remove();
    });

  const icono = document.createElement("link");
  icono.rel = "icon";
  icono.type = "image/png";
  icono.href = "yw-favicon.png";
  document.head.appendChild(icono);

  const apple = document.createElement("link");
  apple.rel = "apple-touch-icon";
  apple.href = "apple-touch-icon.png";
  document.head.appendChild(apple);

  if (!document.querySelector('link[rel="manifest"]')) {
    const manifiesto = document.createElement("link");
    manifiesto.rel = "manifest";
    manifiesto.href = "manifest.json";
    document.head.appendChild(manifiesto);
  }
})();
const scriptInstalar = document.createElement("script");
scriptInstalar.src = "js/instalar.js?v=1";
document.head.appendChild(scriptInstalar);
