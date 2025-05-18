import { User } from '@/payload-types'
import { Access } from 'payload'

export const adminOrCreateRoleCustomer: Access<User> = ({ req: { user }, data }) => {
  if (user?.role?.includes('admin')) {
    return true
  }

  if (!data?.role?.includes('admin')) {
    return true
  }

  return false
}
