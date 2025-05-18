import { User } from '@/payload-types'
import { Access } from 'payload'

export const canUserUpdate: Access<User> = ({ req: { user } }) => {
  if (!user) return false

  return {
    id: {
      equals: user.id,
    },
  }
}
