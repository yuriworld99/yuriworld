const formulario = document.getElementById("form-login");
const mensaje = document.getElementById("mensaje");
const boton = document.getElementById("boton-login");

function mostrarMensaje(texto, tipo) {
  mensaje.textContent = texto;
  mensaje.className = "mensaje " + tipo;
}

formulario.addEventListener("submit", async function (evento) {
  evento.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  boton.disabled = true;
  mostrarMensaje("Entrando...", "");

  const { error } = await supabaseClient.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) {
    mostrarMensaje("Email o contraseña incorrectos.", "error");
    boton.disabled = false;
    return;
  }

  mostrarMensaje("¡Sesión iniciada! Te llevamos al inicio 💜", "ok");
  setTimeout(function () {
    window.location.href = "index.html";
  }, 1500);
});
