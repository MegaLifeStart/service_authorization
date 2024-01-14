const Router = require('express');
const router = new Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../milddleware/AuthMiddleware');
const checkRole = require('../milddleware/checkRoleMiddleware');

router.post('/registration', checkRole(1), userController.registration);
router.get('/send', userController.sendEmail);
router.post('/new/password', userController.newPassword);

router.post('/login', userController.login);
router.get('/auth', authMiddleware, userController.check);
router.get('/all', checkRole(1), userController.getAllAdmin); // Получение все пользователей только для администратора
router.post('/reset/password', userController.resetPassword);
router.get('/teacher/all', userController.getAllTeacher);
router.get('/:id', userController.getUserId);
router.put('/:id',userController.firstEntry);
router.delete('/:id', checkRole(1), userController.deleteUserId);

module.exports = router; 