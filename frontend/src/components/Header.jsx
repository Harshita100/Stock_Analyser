import { useEffect, useRef } from 'react'

const NAV_ITEMS = [
    { id: 'portfolio', label: 'Portfolio Analysis', icon: '◈' },
    { id: 'watchlist', label: 'Watchlist',          icon: '◎' },
]

export default function Header({ activePage, setActivePage }) {
    const inkRef = useRef(null)
    const btnRefs = useRef({})

    // slide the ink-bar under the active tab
    useEffect(() => {
        const el = btnRefs.current[activePage]
        const ink = inkRef.current
        if (!el || !ink) return
        ink.style.left  = `${el.offsetLeft}px`
        ink.style.width = `${el.offsetWidth}px`
    }, [activePage])
        return (
          <header className="sticky top-0 left-0 right-0 z-[100] h-14 bg-[#0a0a0f] border-b border-[#1a1a2e] flex items-center px-7 gap-8">
      
            {/* Logo */}
            <div className="font-[Syne] font-extrabold text-[15px] tracking-[0.08em] text-[#e8e8f0] whitespace-nowrap select-none">
              STOCK<span className="text-[#5b6bff]">LENS</span>
            </div>
      
            {/* Divider */}
            <div className="w-px h-6 bg-[#1e1e3a] shrink-0" />
      
            {/* Nav */}
            <nav className="flex items-center gap-[2px] relative">
              {NAV_ITEMS.map(item => (
                <button
                  key={item.id}
                  ref={el => (btnRefs.current[item.id] = el)}
                  onClick={() => setActivePage(item.id)}
                  className={`
                    font-mono text-[12px] font-medium tracking-[0.05em]
                    px-4 py-[6px] rounded-md flex items-center gap-[7px]
                    transition-colors duration-200 relative z-[1] whitespace-nowrap
                    ${activePage === item.id 
                      ? "text-[#e8e8f0]" 
                      : "text-[#555570] hover:text-[#9090b8]"}
                  `}
                >
                  <span className="text-[11px] opacity-70">{item.icon}</span>
                  {item.label}
                </button>
              ))}
      
              {/* Ink bar */}
              <div
                ref={inkRef}
                className="absolute bottom-[-1px] h-[2px] rounded-t-[2px] bg-gradient-to-r from-[#5b6bff] to-[#a78bfa] transition-all duration-300"
              />
            </nav>
      
            {/* Spacer */}
            <div className="flex-1" />
      
            {/* Badge */}
            <div className="font-mono text-[10px] tracking-[0.12em] text-[#fff] uppercase">
              NSE · BSE
            </div>
          </header>
        );
      }

