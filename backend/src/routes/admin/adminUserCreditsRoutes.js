const router = require('express').Router();
const ctrl = require('../../controllers/admin/adminCompatController');
const { requireAdmin } = require('../../middleware/authMiddleware');

const addCreditRoutes = [
  ['post', '/', ctrl.addCredit],
  ['post', '/:userId/add', ctrl.addCredit],
  ['post', '/:userId/credits', ctrl.addCredit],
  ['post', '/:userId/credit', ctrl.addCredit],
  ['post', '/:userId/wallet/credit', ctrl.addCredit],
  ['post', '/:userId/wallet/add', ctrl.addCredit],
  ['patch', '/', ctrl.addCredit],
  ['patch', '/:userId/add', ctrl.addCredit],
  ['patch', '/:userId/credits', ctrl.addCredit],
  ['patch', '/:userId/credit', ctrl.addCredit],
  ['patch', '/:userId/wallet/credit', ctrl.addCredit],
  ['patch', '/:userId/wallet/add', ctrl.addCredit],
  ['put', '/', ctrl.addCredit],
  ['put', '/:userId/add', ctrl.addCredit],
  ['put', '/:userId/credits', ctrl.addCredit],
  ['put', '/:userId/credit', ctrl.addCredit],
  ['put', '/:userId/wallet/credit', ctrl.addCredit],
  ['put', '/:userId/wallet/add', ctrl.addCredit]
];

router.get('/', requireAdmin, ctrl.listUserCredits);

addCreditRoutes.forEach(([method, path, handler]) => {
  router[method](path, requireAdmin, handler);
});

module.exports = router;
