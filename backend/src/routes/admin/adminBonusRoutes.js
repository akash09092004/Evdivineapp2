const router = require('express').Router();
const ctrl = require('../../controllers/admin/adminBonusController');
const { requireAdmin } = require('../../middleware/authMiddleware');

router.get('/config', requireAdmin, ctrl.getBonusConfig);
router.put('/config', requireAdmin, ctrl.setBonusConfig);
router.get('/transactions', requireAdmin, ctrl.listBonusTransactions);
router.post('/grant', requireAdmin, ctrl.grantBonus);

module.exports = router;
