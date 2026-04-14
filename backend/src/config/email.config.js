function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback
  return String(value).trim().toLowerCase() === 'true'
}

function parseNumber(value, fallback) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function getSupabaseEmailConfig() {
  const supabaseUrl = String(process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '')
  const anonKey = String(process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || '').trim()
  const functionName = String(process.env.SUPABASE_EMAIL_FUNCTION_NAME || 'send-email').trim()

  return {
    url: supabaseUrl,
    anonKey,
    functionName,
    endpoint: supabaseUrl ? `${supabaseUrl}/functions/v1/${functionName}` : '',
  }
}

function getEmailConfig() {
  const supabase = getSupabaseEmailConfig()

  return {
    provider: String(process.env.EMAIL_PROVIDER || '').trim().toLowerCase(),
    host: String(process.env.SMTP_HOST || '').trim(),
    port: parseNumber(process.env.SMTP_PORT, 587),
    secure: parseBoolean(process.env.SMTP_SECURE, false),
    startTls: parseBoolean(process.env.SMTP_STARTTLS, true),
    user: String(process.env.SMTP_USER || '').trim(),
    pass: String(process.env.SMTP_PASS || '').trim(),
    fromName: String(process.env.SMTP_FROM_NAME || 'Plumar').trim(),
    fromEmail: String(process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || '').trim(),
    masterEmail: String(process.env.MASTER_NOTIFICATION_EMAIL || process.env.OWNER_EMAIL || '').trim().toLowerCase(),
    supabase,
  }
}

function isEmailConfigured() {
  const config = getEmailConfig()

  if (config.provider === 'supabase_function') {
    return Boolean(config.supabase.endpoint && config.supabase.anonKey)
  }

  return Boolean(config.host && config.port && config.fromEmail)
}

module.exports = {
  getEmailConfig,
  getSupabaseEmailConfig,
  isEmailConfigured,
}
