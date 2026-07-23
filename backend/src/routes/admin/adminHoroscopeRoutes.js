const router = require('express').Router();
const ctrl = require('../../controllers/admin/adminHoroscopeController');
const { requireAdmin } = require('../../middleware/authMiddleware');

router.get('/', requireAdmin, ctrl.listHoroscopes);
router.post('/', requireAdmin, ctrl.createHoroscope);

module.exports = router;

