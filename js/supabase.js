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
scriptInsignias.src = "js/insignias.js?v=1";
document.head.appendChild(scriptInsignias);

const scriptGeneros = document.createElement("script");
scriptGeneros.src = "js/generos.js?v=1";
scriptGeneros.onload = function () {
  const scriptRecExtra = document.createElement("script");
  scriptRecExtra.src = "js/rec-extra.js?v=1";
  document.head.appendChild(scriptRecExtra);
};
document.head.appendChild(scriptGeneros);
