import { User } from '@smartlaw/types'

declare global {
  namespace Express {
    interface Request {
      user?: User
      sessionId?: string
    }
  }
}