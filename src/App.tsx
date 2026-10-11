const navItems = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Escrow', href: '#escrow' },
  { label: 'Security', href: '#security' },
]

function CrowMark() {
  return (
    <svg viewBox="0 0 34 34" aria-hidden="true" className="brand-mark">
      <rect width="34" height="34" rx="11" fill="currentColor" />
      <path d="M8 21.5 12.3 11l5.1 5.1 4.4-4.3L27 23H17.2l-2.5-3.1-2.1 3.1H8Z" fill="#C6F24E" />
      <circle cx="22.8" cy="10.7" r="1.7" fill="#C6F24E" />
    </svg>
  )
}

export default function App() {
  return (
    <main className="site-shell">
      <div className="ribbon-backdrop" aria-hidden="true">
        <video className="ribbon-backdrop__video" autoPlay muted loop playsInline preload="auto" poster="/images/zecrow-ribbon-poster.webp">
          <source src="/video/zecrow-ribbon-motion.webm" type="video/webm" />
        </video>
      </div>
      <header className="site-header">
        <a className="brand" href="#home" aria-label="Zecrow home">
          <CrowMark />
          <span>zecrow<span className="brand-period">.</span></span>
        </a>
        <nav className="nav-tabs" aria-label="Main navigation">
          {navItems.map((item, index) => (
            <a className={index === 0 ? 'nav-tab nav-tab--active' : 'nav-tab'} href={item.href} key={item.label}>{item.label}</a>
          ))}
        </nav>
        <div className="header-actions">
          <a className="sign-in-link" href="#sign-in">Sign in</a>
          <a className="header-cta" href="#get-started">Get started <span aria-hidden="true">↗</span></a>
        </div>
      </header>
      <div className="empty-canvas" id="home" aria-label="Zecrow homepage canvas" />
    </main>
  )
}
