// Appends the footer's external links to the page links without touching
// the array the navbar also renders from.
export const prepareExternalLinks = (externalLinks, navLinks) => [
  ...navLinks.filter((link) => link.type !== 'external'),
  ...externalLinks.map(({ elements }) => ({
    title: elements.title.value,
    url: elements.url.value,
    type: 'external',
    show: true,
  })),
]
