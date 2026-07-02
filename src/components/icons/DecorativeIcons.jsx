/** Consistent 24×24 stroke icons (replace emoji site-wide). */

function baseProps({ className = '', ...rest }) {
  return {
    className: ['decorative-icon', className].filter(Boolean).join(' '),
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
    ...rest,
  }
}

export function IconBrain(props) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
      <path d="M12 18v4" />
    </svg>
  )
}

export function IconClipboard(props) {
  return (
    <svg {...baseProps(props)}>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z" />
    </svg>
  )
}

export function IconListChecks(props) {
  return (
    <svg {...baseProps(props)}>
      <path d="M10 6h11" />
      <path d="M10 12h11" />
      <path d="M10 18h11" />
      <path d="m3.5 6 .5.5L6 4.5" />
      <path d="m3.5 12 .5.5L6 10.5" />
      <path d="m3.5 18 .5.5L6 16.5" />
    </svg>
  )
}

export function IconChart(props) {
  return (
    <svg {...baseProps(props)}>
      <path d="M3 3v18h18" />
      <path d="M7 12v5" />
      <path d="M12 7v10" />
      <path d="M17 14v3" />
    </svg>
  )
}

export function IconStethoscope(props) {
  return (
    <svg {...baseProps(props)}>
      <path d="M11 2v2" />
      <path d="M13 2v2" />
      <path d="M11 4h2a2 2 0 0 1 2 2v5a5 5 0 0 0 10 0V9a2 2 0 0 0-2-2h-2" />
      <path d="M5 4a2 2 0 0 0-2 2v6a9 9 0 0 0 18 0" />
      <path d="M8 15h.01" />
      <circle cx="16" cy="9" r="2" />
    </svg>
  )
}

export function IconLock(props) {
  return (
    <svg {...baseProps(props)}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

export function IconFolder(props) {
  return (
    <svg {...baseProps(props)}>
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    </svg>
  )
}

export function IconCheck(props) {
  return (
    <svg {...baseProps(props)} strokeWidth={2.5}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

export function IconArrowRight(props) {
  return (
    <svg {...baseProps(props)}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  )
}

export function IconArrowLeft(props) {
  return (
    <svg {...baseProps(props)}>
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  )
}

export function IconUsers(props) {
  return (
    <svg {...baseProps(props)}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

export function IconAtom(props) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="12" cy="12" r="1" />
      <path d="M20.2 7.8c-2.2-3.8-5.4-5.8-8.2-5.8-2.8 0-6 2-8.2 5.8" />
      <path d="M3.8 16.2c2.2 3.8 5.4 5.8 8.2 5.8 2.8 0 6-2 8.2-5.8" />
      <path d="M9.3 4.5c-2.3 4-2.3 11 0 15" />
      <path d="M14.7 4.5c2.3 4 2.3 11 0 15" />
    </svg>
  )
}

export function IconCode(props) {
  return (
    <svg {...baseProps(props)}>
      <path d="m16 18 6-6-6-6" />
      <path d="m8 6-6 6 6 6" />
    </svg>
  )
}

export function IconChip(props) {
  return (
    <svg {...baseProps(props)}>
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <path d="M9 2v4M15 2v4M9 18v4M15 18v4M21 9h-4M21 15h-4M7 15H3M7 9H3" />
    </svg>
  )
}

export function IconDatabase(props) {
  return (
    <svg {...baseProps(props)}>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v6c0 1.7 4 3 9 3s9-1.3 9-3V5" />
      <path d="M3 11v6c0 1.7 4 3 9 3s9-1.3 9-3v-6" />
    </svg>
  )
}

export function IconShield(props) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    </svg>
  )
}

export function IconDocument(props) {
  return (
    <svg {...baseProps(props)}>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2Z" />
      <path d="M14 2v6h6" />
    </svg>
  )
}

export function IconTarget(props) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}

export function IconLeaf(props) {
  return (
    <svg {...baseProps(props)}>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  )
}

export function IconCog(props) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
      <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  )
}

export function IconBinoculars(props) {
  return (
    <svg {...baseProps(props)}>
      <path d="M10 10h4" />
      <path d="M7 18h.01M17 18h.01" />
      <path d="M2 9s2-3 5-3 5 3 5 3v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9Z" />
      <path d="M22 9s-2-3-5-3-5 3-5 3v7a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V9Z" />
    </svg>
  )
}

export function IconAlertMedical(props) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
  )
}

export function IconVideo(props) {
  return (
    <svg {...baseProps(props)}>
      <rect x="3" y="5" width="14" height="14" rx="2" ry="2" />
      <path d="M11 9.5 15.5 12 11 14.5v-5Z" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconMenu(props) {
  return (
    <svg {...baseProps(props)}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

export function IconClose(props) {
  return (
    <svg {...baseProps(props)}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

export function IconChevronDown(props) {
  return (
    <svg {...baseProps(props)}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}
