/**
 * Rotas admin do agendamento via Meta Graph API.
 * Registradas em /api/meta/*. Todas exigem role=owner.
 */
'use strict'

const express = require('express')
const metaController = require('../controllers/meta.controller')

const router = express.Router()

// Middleware local — apenas owner acessa endpoints de agendamento.
// Espera req.currentUser já atachado por middleware upstream (attachCurrentUser).
function requireOwnerLocal(req, res, next) {
  const user = req.currentUser || req.user
  if (!user) return res.status(401).json({ error: 'Não autenticado' })
  if (user.role !== 'owner') return res.status(403).json({ error: 'Acesso restrito ao owner' })
  next()
}

router.use(requireOwnerLocal)

// CRUD
router.get('/scheduled', metaController.listScheduled)
router.post('/schedule', metaController.scheduleOne)
router.get('/scheduled/:id', metaController.getScheduled)
router.post('/scheduled/:id/cancel', metaController.cancelScheduled)
router.delete('/scheduled/:id', metaController.deleteScheduled)

// Publicação imediata (force publish — ignora scheduled_for)
router.post('/scheduled/:id/publish-now', metaController.publishNow)

// Sweep manual (útil para testes sem esperar o cron)
router.post('/sweep', metaController.runDueSweep)

module.exports = router
