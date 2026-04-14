const userRepository = require('../repositories/user.repository')
const { buildAccessSummary } = require('../utils/subscription.utils')
const { notifyUpcomingExpiration } = require('./subscription-notification.service')

const REMINDER_RULES = {
  trial: [1],
  monthly: [7],
  annual: [30, 15, 7, 3, 1],
}

function startOfDay(dateInput) {
  const date = new Date(dateInput)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function getDaysUntil(targetDate, now = new Date()) {
  if (!targetDate) return null
  const msPerDay = 86_400_000
  const target = startOfDay(targetDate).getTime()
  const current = startOfDay(now).getTime()
  return Math.round((target - current) / msPerDay)
}

function buildReminderTarget(user) {
  if (user.role === 'owner' || user.subscriptionStatus === 'lifetime' || user.isLifetimeOwner) {
    return null
  }

  if (user.subscriptionStatus === 'trialing' && user.trialEndsAt) {
    return {
      type: 'trial',
      targetDate: user.trialEndsAt,
      allowedDays: REMINDER_RULES.trial,
    }
  }

  if (user.subscriptionStatus === 'active' && user.currentPeriodEnd) {
    return {
      type: user.subscriptionPlan === 'annual' ? 'annual' : 'monthly',
      targetDate: user.currentPeriodEnd,
      allowedDays: user.subscriptionPlan === 'annual' ? REMINDER_RULES.annual : REMINDER_RULES.monthly,
    }
  }

  return null
}

function hasReminderBeenSent(user, reminderKey) {
  return (user.notificationHistory || []).some((entry) => entry.key === reminderKey)
}

function createReminderEntry({ reminderType, daysBefore, targetDate, result }) {
  return {
    key: `${reminderType}:${daysBefore}:${targetDate}`,
    type: 'subscription_reminder',
    reminderType,
    daysBefore,
    targetDate,
    sentAt: new Date().toISOString(),
    delivered: Boolean(result?.delivered),
    skipped: Boolean(result?.skipped),
    to: result?.to || null,
    subject: result?.subject || null,
  }
}

async function processUserReminder(user) {
  const reminderTarget = buildReminderTarget(user)
  if (!reminderTarget) return null

  const daysUntil = getDaysUntil(reminderTarget.targetDate)
  if (daysUntil === null || !reminderTarget.allowedDays.includes(daysUntil)) {
    return null
  }

  const access = buildAccessSummary(user)
  if (!access.accessGranted && reminderTarget.type !== 'trial') {
    return null
  }

  const reminderKey = `${reminderTarget.type}:${daysUntil}:${reminderTarget.targetDate}`
  if (hasReminderBeenSent(user, reminderKey)) {
    return null
  }

  const result = await notifyUpcomingExpiration({
    user,
    access,
    reminderType: reminderTarget.type,
    daysBefore: daysUntil,
    expiresAt: reminderTarget.targetDate,
  })

  if (!result?.delivered) {
    return {
      userId: user.id,
      sent: false,
      skipped: true,
      reason: result?.reason || 'E-mail não entregue.',
    }
  }

  await userRepository.updateUser(user.id, (current) => ({
    ...current,
    notificationHistory: [
      ...(Array.isArray(current.notificationHistory) ? current.notificationHistory : []),
      createReminderEntry({
        reminderType: reminderTarget.type,
        daysBefore: daysUntil,
        targetDate: reminderTarget.targetDate,
        result,
      }),
    ],
  }))

  return {
    userId: user.id,
    sent: true,
    daysBefore: daysUntil,
    type: reminderTarget.type,
    to: result.to,
  }
}

async function runSubscriptionReminderSweep() {
  const users = await userRepository.readUsers()
  const results = []

  for (const user of users) {
    try {
      const result = await processUserReminder(user)
      if (result) results.push(result)
    } catch (error) {
      console.error('[subscription-reminder/user]', user.email, error)
      results.push({
        userId: user.id,
        sent: false,
        error: error.message,
      })
    }
  }

  return results
}

function startSubscriptionReminderWorker() {
  const enabled = String(process.env.SUBSCRIPTION_REMINDERS_ENABLED || 'true').trim().toLowerCase() !== 'false'
  if (!enabled) {
    return null
  }

  const intervalHours = Number(process.env.SUBSCRIPTION_REMINDER_INTERVAL_HOURS || 12)
  const intervalMs = Math.max(1, intervalHours) * 60 * 60 * 1000

  const run = async () => {
    try {
      const results = await runSubscriptionReminderSweep()
      if (results.length) {
        console.log(`[subscription-reminder] avisos processados: ${results.length}`)
      }
    } catch (error) {
      console.error('[subscription-reminder/run]', error)
    }
  }

  run()
  return setInterval(run, intervalMs)
}

module.exports = {
  getDaysUntil,
  runSubscriptionReminderSweep,
  startSubscriptionReminderWorker,
}
