import { pagePath } from './paths'

export const prepareNavLinks = (pages) => {
  const {
    subpages: { value: subpages },
  } = pages.elements
  const navLinks = []
  subpages.forEach((page) => {
    if (!page.system) return
    const {
      system: { type },
    } = page
    const showInNavigation = !(
      type !== 'event_landing' &&
      page.elements.show_in_navigation.value[0].name.toLowerCase() === 'no'
    )
    const path = pagePath(page)

    const pageTitle = page.elements.title
      ? page.elements.title.value.trim()
      : page.elements.seo__title?.value.trim()
    navLinks.push({
      title: pageTitle,
      url: path,
      type: 'page',
      show: showInNavigation,
    })
  })
  return navLinks
}
