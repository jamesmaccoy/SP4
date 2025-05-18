import { Access, User, Where } from 'payload'

export const adminSelfOrAdded: Access<User> = ({ req: { user } }) => {
  if (!user) return false

  if (user?.role?.includes('admin')) {
    return true
  }

  const query: Where = {
    and: [
      {
        id: {
          equals: user.id as string,
        },
      },
      {
        email: {
          equals: user.id as string,
        },
      },
    ],
  }

  return query
}
