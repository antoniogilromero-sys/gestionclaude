// Google Apps Script — envía cada respuesta nueva del Forms de
// inscripción a la app del club.
//
// CÓMO INSTALARLO (una sola vez):
// 1. Abre la hoja de cálculo "Form_Responses" (donde caen las respuestas).
// 2. Menú Extensiones > Apps Script.
// 3. Borra lo que haya en el editor y pega este archivo entero.
// 4. Sustituye WEBHOOK_URL y WEBHOOK_SECRET por los valores reales (te
//    los doy yo cuando despliegue la parte de la app).
// 5. Arriba a la izquierda, en el desplegable de funciones, elige
//    `instalarDisparador` y pulsa "Ejecutar" UNA VEZ — te pedirá
//    autorización, acéptala. Esto deja el envío automático funcionando
//    para todas las respuestas nuevas a partir de ahora (las que ya
//    estaban antes de instalar esto no se reenvían solas).

var WEBHOOK_URL = "https://gestionclaude.vercel.app/api/inscripciones/webhook";
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

function alRecibirRespuesta(e) {
  var nv = e.namedValues;
  var payload = {
    email: buscar(nv, "EMAIL"),
    nombreCompleto: buscar(nv, "NOMBRE"),
    dni: buscar(nv, "DNI"),
    fechaNacimiento: buscar(nv, "FECHA DE"),
    domicilio: buscar(nv, "DOMICILIO"),
    tallaCamiseta: buscar(nv, "TALLA"),
    diasPiscina: buscar(nv, "USO DE PISCI"),
    proteccionDatos: buscar(nv, "PROTECCION"),
    derechosImagen: buscar(nv, "DERECHOS"),
    telefono: buscar(nv, "TELEFONO"),
    email2: buscar(nv, "EMAIL 2"),
    tarifa: buscar(nv, "TARIFA"),
  };

  var respuesta = UrlFetchApp.fetch(WEBHOOK_URL, {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: "Bearer " + WEBHOOK_SECRET },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });

  if (respuesta.getResponseCode() !== 200) {
    // Deja constancia en los registros de ejecución (Apps Script > Ejecuciones)
    // para poder ver qué falló sin tener que adivinarlo.
    Logger.log("Fallo al enviar inscripción: " + respuesta.getContentText());
  }
}
