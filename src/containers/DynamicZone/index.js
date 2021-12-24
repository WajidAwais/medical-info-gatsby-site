import React from 'react'
import CallToAction from '../CallToAction'
import InfoBlock from '../InfoBlock'
import { DEFAULT_LANGUAGE } from '../../utils/constants'

const DynamicZone = ({
  data,
  socialSharing = null,
  languageCode = DEFAULT_LANGUAGE,
}) => {
  const sections = data.map((section) => {
    const {
      elements,
      system: { type, id, codename },
    } = section

    switch (type) {
      case 'info_block':
        return (
          <InfoBlock
            key={id}
            data={elements}
            id={id}
            socialSharing={socialSharing}
          />
        )
      case 'call_to_action':
        return (
          <CallToAction
            key={id}
            data={elements}
            id={id}
            codename={codename}
            languageCode={languageCode}
          />
        )
      default:
        return null
    }
  })
  return sections
}

export default DynamicZone
