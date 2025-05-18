import * as React from 'react'

type Props = {
  message?: string
}

export const Error: React.FC<Props> = ({ message }) => {
  return (
    <div className="mt-2 text-red-500 text-sm">{message ? message : 'This field is required'}</div>
  )
}
