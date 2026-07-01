import { useEffect } from 'react'

export function MetaDescription({ content }) {
  useEffect(() => {
    let el = document.querySelector('meta[name="description"]')
    if (!el) {
      el = document.createElement('meta')
      el.setAttribute('name', 'description')
      document.head.appendChild(el)
    }
    el.setAttribute('content', content)
  }, [content])
  return null
}
