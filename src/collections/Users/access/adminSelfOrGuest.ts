import { Access, Where } from 'payload'

export const adminSelfOrGuest: Access = ({ req: { user } }) => {
  if (!user) return false

  if (user?.role?.includes('admin')) {
    return true
  }

  const query: Where = {
    or: [
      {
        id: {
          equals: user?.id,
        },
      },
      {
        addedBy: {
          equals: user?.id,
        },
      },
    ],
  }

  return query
}
