const Router = require('express');
const router = new Router();
const roleController = require('../controllers/roleController');
const checkRole = require('../milddleware/checkRoleMiddleware');


router.post('/create', checkRole(1), roleController.create);
router.get('/all', roleController.getAll);
router.get('/:id', roleController.getRole);
router.delete('/delete/:id', checkRole(1), roleController.delete);




module.exports = router; 