import { Router } from 'express'
import { CategoryController } from '../controllers/category.controller'
import { authenticateToken } from '../middlewares/authenticate.middleware'

const categoryController = new CategoryController()
const categoryRoutes = Router()

categoryRoutes.get(
  '/:type',
  authenticateToken,
  categoryController.getCategories
)

categoryRoutes.post('', authenticateToken, categoryController.addCategory)

categoryRoutes.put('', authenticateToken, categoryController.editCategory)

export default categoryRoutes
