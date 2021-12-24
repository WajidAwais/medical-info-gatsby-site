import React, { useEffect } from 'react'
import '../../assets/scss/main.scss'
import FooterDefault from '../../containers/Footer/variants/FooterDefault'
import NavbarDefault from '../../containers/Navbar/variants/NavbarDefault'
import { useTheme } from '../../hooks/useTheme'
import ConfirmModal from '../Modal/variants/ConfirmModal'
import { DEFAULT_LANGUAGE } from '../../utils/constants'
import KontentSmartLink from '@kontent-ai/smart-link'
import {
  fetchLanguages,
  fetchTranslations,
  languageRoot,
} from '../../utils/delivery'

// The URL's first segment carries the language (/de/...); English has none.
export const languageForPath = (pathname, languages) => {
  const [firstSegment = ''] = (pathname || '').split('/').filter(Boolean)
  return (
    languages.find((lang) => lang.name === firstSegment.toUpperCase()) ||
    languages.find((lang) => lang.name === DEFAULT_LANGUAGE.toUpperCase())
  )
}

const Layout = ({ children, languageCode = 'en', navLinks, footerData }) => {
  const { state, actions } = useTheme()

  useEffect(() => {
    // Smart Link only activates with ?enable-ksl-sdk (Kontent Web Spotlight).
    const kontentSmartLink = KontentSmartLink.initialize({
      queryParam: 'enable-ksl-sdk',
    })
    return () => {
      kontentSmartLink.destroy()
    }
  }, [])

  useEffect(() => {
    if (state.languages.length) return
    let cancelled = false
    fetchLanguages()
      .catch(() => [])
      .then((fetched) => {
        if (cancelled) return
        // Without the API the page still needs its own language for the
        // switcher and the stored preference.
        actions.changeLanguages(
          fetched.length
            ? fetched
            : [
                {
                  name: languageCode.toUpperCase(),
                  url: languageRoot(languageCode),
                  region: '',
                },
              ]
        )
      })
    return () => {
      cancelled = true
    }
  }, [state.languages.length, languageCode, actions])

  useEffect(() => {
    if (!state.languages.length) return
    actions.changeLanguage(
      languageForPath(window.location.pathname, state.languages)
    )
  }, [state.languages, languageCode, actions])

  useEffect(() => {
    let cancelled = false
    fetchTranslations(languageCode)
      .catch(() => [])
      .then((translations) => {
        if (!cancelled) actions.changeTranslations(translations)
      })
    return () => {
      cancelled = true
    }
  }, [languageCode, actions])

  return (
    <div
      data-kontent-project-id={process.env.GATSBY_KONTENT_PROJECT_ID}
      data-kontent-language-codename={
        process.env.GATSBY_KONTENT_LANGUAGE_CODENAMES
      }
    >
      <ConfirmModal languageCode={languageCode} />
      {navLinks !== undefined && (
        <NavbarDefault
          navLinks={navLinks}
          languageCode={languageCode}
          languages={state.languages}
        />
      )}
      {children}
      {navLinks !== undefined && (
        <FooterDefault
          navLinks={navLinks}
          footer={footerData}
          languageCode={languageCode}
        />
      )}
    </div>
  )
}

export default Layout
