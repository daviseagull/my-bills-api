import { Router } from 'express'
import { container } from 'tsyringe'
import { AccountController } from '../controllers/account.controller'
import { authenticateToken } from '../middlewares/authenticate.middleware'

const controller = container.resolve(AccountController)
const accountRoutes = Router()

accountRoutes.post('', authenticateToken, controller.create)

export default accountRoutes
