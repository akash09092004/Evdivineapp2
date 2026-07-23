const router = require('express').Router();
const ctrl = require('../../controllers/user/userHoroscopeController');

router.get('/today/:rashi', ctrl.todayHoroscope);
router.get('/', ctrl.listHoroscopes);

module.exports = router;

