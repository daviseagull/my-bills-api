import { configDotenv } from 'dotenv'
import express from 'express'
import 'express-async-errors'
import { errorHandler } from '@/infra/http/middlewares/error-handler.middleware'
import { authenticateToken } from './middlewares/authenticate.middleware'
import unauthenticatedRoutes from './unauthenticated-routes'
import authenticatedRoutes from './authenticated-routes'

configDotenv()
const app = express()

app.use(express.json())
app.use(unauthenticatedRoutes)
app.use(authenticateToken)
app.use(authenticatedRoutes)
app.use(errorHandler)

export default app