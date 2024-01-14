const ApiError = require('../error/ApiError');
const {Role} = require('../models/models');

class RoleController {
    
    async create(req, res, next) {
        const {name} = req.body;
        const candidate = await Role.findOne({where: {name}});
        if(candidate) {
            return next(ApiError.badRequest('Роль уже существует'));
        }
        const role = await Role.create({name});
        return res.json(role)
    } 


    async getRole(req, res, next) {
        const role = await Role.findByPk(req.params.id);
        try {
            if(!role) {
                return next(ApiError.badRequest('Роль не найдена'));
            }
            return res.json(role);
        } catch (error) {
            return next(ApiError.badRequest(error.message));
        }
        
    }


    async getAll(req, res, next) {
        try {
            const roles = await Role.findAll();
            return res.json(roles);
        } catch (error) {
            next(ApiError.badRequest(error.message));
        }
    } 
    async delete(req, res, next) {
        try {
            const role = await Role.findByPk(req.params.id);
            if (!role) {
                return next(ApiError.badRequest('Role not found'));
            }
            await role.destroy();
            res.send('Role deleted');
        } catch (error) {
            return next(ApiError.badRequest(error.message));
        }
    }

   
    
}

module.exports = new RoleController();