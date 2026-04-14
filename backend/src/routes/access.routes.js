const router = require('express').Router()
const authMiddleware = require('../middleware/auth.middleware')
const csrfProtection = require('../middleware/csrf.middleware')
const { apiLimiter } = require('../middleware/rateLimit')
const { attachCurrentUser, requireOwner } = require('../middleware/access.middleware')
const accessController = require('../controllers/access.controller')

router.use(authMiddleware)
router.use(apiLimiter)
router.use(attachCurrentUser)

router.get('/me', accessController.getMyAccess)
router.post('/request', csrfProtection, accessController.requestSubscription)
router.post('/checkout', csrfProtection, accessController.createCheckout)
router.post('/checkout/:paymentId/confirm', csrfProtection, accessController.confirmInternalPayment)
router.post('/checkout/reconcile', csrfProtection, accessController.reconcileCheckout)

router.get('/admin/subscribers', requireOwner, accessController.listSubscribers)
router.post('/admin/subscribers/:userId/grant', requireOwner, csrfProtection, accessController.grantAccess)
router.post('/admin/subscribers/:userId/extend-trial', requireOwner, csrfProtection, accessController.extendTrial)
router.post('/admin/payments/:paymentId/approve', requireOwner, csrfProtection, accessController.approvePayment)
router.post('/admin/payments/:paymentId/reject', requireOwner, csrfProtection, accessController.rejectPayment)
router.delete('/admin/payments/:paymentId', requireOwner, csrfProtection, accessController.deletePayment)

module.exports = router
