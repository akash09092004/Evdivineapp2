const router = require('express').Router();
const ctrl = require('../controllers/public/contentController');
const contactMessageCtrl = require('../controllers/public/contactMessageController');

router.get('/rashis', ctrl.listActiveRashis);
router.get('/rashis/:slug', ctrl.getRashiBySlug);
router.get('/banners', ctrl.listActiveBanners);
router.get('/banners/:id', ctrl.getActiveBannerById);
router.get('/horoscopes/today/:rashi', ctrl.todayHoroscope);
router.get('/page-content', ctrl.listPageContent);
router.get('/page-content/:pageKey', ctrl.getPageContentByKey);
router.post('/contact-messages', contactMessageCtrl.createContactMessage);

module.exports = router;
