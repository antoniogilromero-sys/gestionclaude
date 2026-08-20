// Google Apps Script — cada vez que llega una respuesta nueva del Forms
// de inscripción: 1) manda un correo de bienvenida a quien se acaba de
// apuntar, y 2) relee la hoja ENTERA y la manda a la app del club para
// que Administración > Inscripciones sea siempre un espejo exacto del
// Google Sheet (añade lo nuevo, actualiza lo que haya cambiado y borra
// lo que ya no esté en la hoja — evita duplicados).
//
// CÓMO INSTALARLO (una sola vez):
// 1. Abre la hoja de cálculo "Form_Responses" (donde caen las respuestas).
// 2. Menú Extensiones > Apps Script.
// 3. Borra lo que haya en el editor y pega este archivo entero.
// 4. Sustituye WEBHOOK_SECRET por el valor real (el mismo secreto que ya
//    tenías puesto si lo estás actualizando, o el que te dé Antón/Claude
//    la primera vez).
// 5. Arriba a la izquierda, en el desplegable de funciones, elige
//    `instalarDisparador` y pulsa "Ejecutar" UNA VEZ — te pedirá
//    autorización, acéptala. Esto deja el envío automático funcionando
//    para todas las respuestas nuevas a partir de ahora.
//
// IMPORTANTE si ya tenías este script instalado antes de agosto 2026:
// la URL apuntaba por error a "gestionclaude.vercel.app" (un dominio que
// no existe, da 404) en vez de "triatlonalpedrete.vercel.app" — así que
// ninguna respuesta nueva del formulario ha llegado nunca a la app desde
// que se instaló, aunque el script se ejecutara "bien" (Apps Script no
// avisa de un 404, solo lo deja en los registros de ejecución). Pega
// este archivo actualizado entero y vuelve a ejecutar
// `instalarDisparador` para corregirlo.

var WEBHOOK_URL_SYNC = "https://triatlonalpedrete.vercel.app/api/inscripciones/sincronizar";
var WEBHOOK_SECRET = "PON_AQUI_EL_SECRETO";

function instalarDisparador() {
  var hoja = SpreadsheetApp.getActiveSpreadsheet();
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === "alRecibirRespuesta") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("alRecibirRespuesta").forSpreadsheet(hoja).onFormSubmit().create();
}

// Busca la primera pregunta del formulario cuyo título empiece por el
// texto dado (sin distinguir mayúsculas). Los títulos completos de tus
// preguntas pueden ser más largos de lo que cabe en la columna de la
// hoja, así que se busca por el principio, no por el texto exacto.
function buscar(namedValues, empiezaPor) {
  var claves = Object.keys(namedValues);
  for (var i = 0; i < claves.length; i++) {
    if (claves[i].toUpperCase().indexOf(empiezaPor.toUpperCase()) === 0) {
      return (namedValues[claves[i]] || [])[0] || "";
    }
  }
  return "";
}

// Igual que `buscar`, pero para cuando no tenemos `namedValues` (solo al
// disparador de un formulario recién enviado) sino que estamos leyendo
// la hoja entera con la fila de cabeceras aparte.
function indiceColumna(cabeceras, empiezaPor) {
  for (var i = 0; i < cabeceras.length; i++) {
    if (String(cabeceras[i]).toUpperCase().indexOf(empiezaPor.toUpperCase()) === 0) return i;
  }
  return -1;
}

// Lee TODA la hoja de respuestas (todas las filas, no solo la que acaba
// de llegar) y la convierte en el mismo formato de objeto que espera la
// app, uno por persona.
function leerTodasLasFilas() {
  var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var datos = hoja.getDataRange().getValues();
  if (datos.length < 2) return [];
  var cabeceras = datos[0];

  var idx = {
    email: indiceColumna(cabeceras, "EMAIL"),
    nombreCompleto: indiceColumna(cabeceras, "NOMBRE"),
    dni: indiceColumna(cabeceras, "DNI"),
    fechaNacimiento: indiceColumna(cabeceras, "FECHA DE"),
    domicilio: indiceColumna(cabeceras, "DOMICILIO"),
    tallaCamiseta: indiceColumna(cabeceras, "TALLA"),
    diasPiscina: indiceColumna(cabeceras, "USO DE PISCI"),
    proteccionDatos: indiceColumna(cabeceras, "PROTECCION"),
    derechosImagen: indiceColumna(cabeceras, "DERECHOS"),
    telefono: indiceColumna(cabeceras, "TELEFONO"),
    email2: indiceColumna(cabeceras, "EMAIL 2"),
    tarifa: indiceColumna(cabeceras, "TARIFA"),
  };

  function valorDe(fila, clave) {
    var i = idx[clave];
    if (i < 0 || i >= fila.length) return "";
    var v = fila[i];
    if (v instanceof Date) {
      return Utilities.formatDate(v, Session.getScriptTimeZone(), "yyyy-MM-dd");
    }
    return v === null || v === undefined ? "" : String(v);
  }

  var filas = [];
  for (var f = 1; f < datos.length; f++) {
    var fila = datos[f];
    var nombreCompleto = valorDe(fila, "nombreCompleto");
    if (!nombreCompleto) continue; // fila en blanco al final de la hoja
    filas.push({
      email: valorDe(fila, "email"),
      nombreCompleto: nombreCompleto,
      dni: valorDe(fila, "dni"),
      fechaNacimiento: valorDe(fila, "fechaNacimiento"),
      domicilio: valorDe(fila, "domicilio"),
      tallaCamiseta: valorDe(fila, "tallaCamiseta"),
      diasPiscina: valorDe(fila, "diasPiscina"),
      proteccionDatos: valorDe(fila, "proteccionDatos"),
      derechosImagen: valorDe(fila, "derechosImagen"),
      telefono: valorDe(fila, "telefono"),
      email2: valorDe(fila, "email2"),
      tarifa: valorDe(fila, "tarifa"),
    });
  }
  return filas;
}

// Manda la hoja entera a la app para que la sincronice (inserta lo
// nuevo, actualiza lo que cambió, borra lo que ya no esté). Se puede
// ejecutar también a mano desde el editor de Apps Script eligiendo esta
// función en el desplegable y pulsando "Ejecutar", sin esperar a que
// llegue una respuesta nueva.
function sincronizarTodoAhora() {
  var filas = leerTodasLasFilas();
  var respuesta = UrlFetchApp.fetch(WEBHOOK_URL_SYNC, {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: "Bearer " + WEBHOOK_SECRET },
    payload: JSON.stringify({ filas: filas }),
    muteHttpExceptions: true,
  });
  if (respuesta.getResponseCode() !== 200) {
    Logger.log("Fallo al sincronizar inscripciones: " + respuesta.getContentText());
  } else {
    Logger.log("Sincronización OK: " + respuesta.getContentText());
  }
}

function alRecibirRespuesta(e) {
  var nv = e.namedValues;
  var email = buscar(nv, "EMAIL");
  var email2 = buscar(nv, "EMAIL 2");
  var nombreCompleto = buscar(nv, "NOMBRE");

  sincronizarTodoAhora();

  enviarBienvenida(email || email2, nombreCompleto);
}

// Correo de bienvenida automático, mandado desde tu propia cuenta de
// Gmail (la que tenga esta hoja abierta) en el momento en que alguien
// rellena el formulario. Si no hay ningún email (pasa con muy pocos
// registros, ej. quien solo dejó teléfono), no manda nada y lo deja
// anotado en los registros de ejecución para que lo veas tú.
function enviarBienvenida(email, nombreCompleto) {
  if (!email) {
    Logger.log("Sin email, no se manda bienvenida a: " + nombreCompleto);
    return;
  }
  var nombrePila = (nombreCompleto || "").trim().split(" ")[0] || "";

  var asunto = "¡Bienvenido/a al C.D.E. Triatlón Alpedrete!";
  var cuerpo =
    "¡Hola " + nombrePila + "! 🏊‍♂️🚴‍♀️🏃‍♂️\n\n" +
    "Bienvenido/a al C.D.E. Triatlón Alpedrete. Hemos recibido tu inscripción, " +
    "¡así que ya formas parte del club!\n\n" +
    "Puedes consultar los horarios de entrenamiento (días, disciplina y hora) sin " +
    "necesidad de cuenta ni contraseña, aquí:\n" +
    "https://triatlonalpedrete.vercel.app/horario-publico\n\n" +
    "Y si quieres equipación oficial del club (camiseta, sudadera, etc.), puedes " +
    "comprarla aquí:\n" +
    "https://tienda.austral.es/alpedretetriatlon/index.php?id_category=48&controller=category\n\n" +
    "Cualquier duda sobre grupo, material que necesites o primer día de " +
    "entrenamiento, escríbeme por aquí sin problema.\n\n" +
    "¡Nos vemos pronto en la piscina/pista! 💪\n\n" +
    "Toni — Director técnico";

  try {
    MailApp.sendEmail(email, asunto, cuerpo);
  } catch (err) {
    Logger.log("Fallo al mandar bienvenida a " + email + ": " + err);
  }
}
