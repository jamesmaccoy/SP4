import { CollectionBeforeValidateHook } from 'payload'

export const fillAddedByField: CollectionBeforeValidateHook = async ({
  data,
  req: { user },
  operation,
}) => {
  if (operation === 'create' && user) {
    if (typeof data === 'object') {
      data.addedBy = user.id
    }
  }

  return data
}
