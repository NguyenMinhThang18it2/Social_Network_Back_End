var express = require('express');
var router = express.Router();
var controller = require('../../controllers/api/notification.api.controller.js');

router.get('/notification/:id', controller.getNotification);

router.get('/updatenotification/:id', controller.updateNotification);
module.exports = router;