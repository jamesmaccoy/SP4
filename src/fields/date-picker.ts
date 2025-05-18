import { Block } from 'payload'

export const DatePicker: Block = {
  slug: 'datePicker',
  labels: {
    singular: 'Date Picker',
    plural: 'Date Pickers',
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'name',
          label: 'Name (lowercase, no special characters)',
          type: 'text',
          required: true,
          admin: {
            width: '50%',
          },
        },
        {
          name: 'label',
          label: 'Label',
          type: 'text',
          admin: {
            width: '50%',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'width',
          type: 'number',
          label: 'Field Width (percentage)',
          admin: {
            width: '50%',
          },
        },
        {
          name: 'maxDays',
          label: 'Max Days',
          type: 'number',
          admin: {
            description: 'The maximum number of days that can be selected',
            width: '50%',
          },
        },
      ],
    },
    {
      type: 'checkbox',
      name: 'required',
      label: 'Required',
      defaultValue: false,
    },
  ],
}
