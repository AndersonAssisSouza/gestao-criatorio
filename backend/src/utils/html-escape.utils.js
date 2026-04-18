/**
 * Escapa caracteres HTML para prevenir injection em e-mails/documentos HTML.
 * Uso: `${escapeHtml(userInput)}` em vez de `${userInput}`.
 */
function escapeHtml(value) {
  const s = value === undefined || value === null ? '' : String(value)
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Escapa valor para uso dentro de atributo HTML (ex: href, title).
 * Mais restrito: escapa também backtick e igual.
 */
function escapeHtmlAttr(value) {
  return escapeHtml(value).replace(/`/g, '&#96;').replace(/=/g, '&#61;')
}

module.exports = {
  escapeHtml,
  escapeHtmlAttr,
}
