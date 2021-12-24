// Kontent styling options use codenames like `steel_light` and `n3`; the
// stylesheet expects `bg-steel-light` and `pt-3`.
const firstCodename = (element) => element?.value?.[0]?.codename

const getStyles = (data) => {
  const background = firstCodename(data.backgroundColor)
  const paddingTop = firstCodename(data.paddingTop)
  const paddingBottom = firstCodename(data.paddingBottom)
  return {
    backgroundColor: background ? `bg-${background.replace(/_/g, '-')}` : '',
    paddingTop: paddingTop ? `pt-${paddingTop.replace(/^n/, '')}` : '',
    paddingBottom: paddingBottom ? `pb-${paddingBottom.replace(/^n/, '')}` : '',
  }
}

export default getStyles
