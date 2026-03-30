// // src/App.js
// // import Chart from './components/Chart.js'
// // import OrderPanel from './components/OrderPanel'
// import SMAChart from './components/SMAChart.js'

// function App() {
//     return (
//         <div>
//             <h1>Stock Analyser</h1>
//             {/* <Chart /> */}
//             <SMAChart />
//         </div>
        
//     )
// }

// export default App
import './index.css'
import { useState, useRef, useEffect } from 'react'
import Header from './components/Header'
import SMAChart from './components/SMAChart.js'
import WatchlistPage from './components/WatchlistPage'

// Wheel / carousel transition:
// - current page rotates out to the left (rotateY(-90deg) + translateX(-60%))
// - next page rotates in from the right (rotateY(90deg) → 0)
// We achieve this with two layers: "outgoing" and "incoming"

const PAGES = ['portfolio', 'watchlist']

export default function App() {
    const [activePage,   setActivePage]   = useState('portfolio')
    const [displayPage,  setDisplayPage]  = useState('portfolio')  // what's currently rendered
    const [animating,    setAnimating]    = useState(false)
    const [direction,    setDirection]    = useState(1)   // 1 = going right, -1 = going left
    const [phase,        setPhase]        = useState('idle') // idle | exit | enter
    const prevPage = useRef('portfolio')

    const navigate = (page) => {
        if (page === activePage || animating) return
        const dir = PAGES.indexOf(page) > PAGES.indexOf(activePage) ? 1 : -1
        setDirection(dir)
        setActivePage(page)
        setAnimating(true)
        setPhase('exit')
    }

    // Drive the animation phases
    useEffect(() => {
        if (!animating) return

        if (phase === 'exit') {
            // after exit animation (300ms), swap content and start enter
            const t = setTimeout(() => {
                prevPage.current = displayPage
                setDisplayPage(activePage)
                setPhase('enter')
            }, 320)
            return () => clearTimeout(t)
        }

        if (phase === 'enter') {
            // after enter animation (350ms), reset
            const t = setTimeout(() => {
                setPhase('idle')
                setAnimating(false)
            }, 380)
            return () => clearTimeout(t)
        }
    }, [phase, animating, activePage, displayPage])

    const getExitStyle = () => {
        if (phase !== 'exit') return {}
        return {
            transform:  `rotateY(${direction * -90}deg) translateX(${direction * -40}%)`,
            opacity:    0,
            transition: 'transform 0.32s cubic-bezier(0.55, 0, 1, 0.45), opacity 0.28s ease',
        }
    }

    const getEnterStyle = () => {
        if (phase === 'enter') return {
            transform:  'rotateY(0deg) translateX(0%)',
            opacity:    1,
            transition: 'transform 0.36s cubic-bezier(0, 0.55, 0.45, 1), opacity 0.28s ease 0.05s',
        }
        if (phase === 'exit') return {} // not shown yet
        return {}
    }

    const pageStyle = {
        willChange:     'transform, opacity',
        transformOrigin: direction > 0 ? 'left center' : 'right center',
        perspective:    '1200px',
    }

    return (
        <>
            <style>{`
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

                html, body, #root {
                    height: 100%;
                    background: #07070d;
                    overflow-x: hidden;
                }

                .app-stage {
                    position: relative;
                    overflow: hidden;
                    perspective: 1200px;
                    min-height: 100vh;
                }

                .page-layer {
                    position: absolute;
                    top: 0; left: 0; right: 0;
                    min-height: 100vh;
                    backface-visibility: hidden;
                    -webkit-backface-visibility: hidden;
                }

                .page-layer.static {
                    position: relative;
                }

                /* Initial state for entering page — off to the side */
                .page-enter-initial {
                    transform: rotateY(var(--enter-from)) translateX(var(--enter-tx));
                    opacity: 0;
                }
            `}</style>

            <Header activePage={activePage} setActivePage={navigate} />

            <div className="app-stage">
                {phase === 'exit' && (
                    /* Outgoing page — animates away */
                    <div
                        className="page-layer"
                        style={{ ...pageStyle, ...getExitStyle() }}
                    >
                        {displayPage === 'portfolio'
                            ? <SMAChart />
                            : <WatchlistPage />
                        }
                    </div>
                )}

                {phase === 'enter' ? (
                    /* Incoming page — animates in */
                    <div
                        className="page-layer"
                        style={{
                            ...pageStyle,
                            transformOrigin: direction > 0 ? 'right center' : 'left center',
                            transform: `rotateY(${direction * 90}deg) translateX(${direction * 40}%)`,
                            opacity: 0,
                            animation: 'none',
                            ...getEnterStyle(),
                        }}
                    >
                        {activePage === 'portfolio'
                            ? <SMAChart />
                            : <WatchlistPage />
                        }
                    </div>
                ) : phase === 'idle' ? (
                    /* Resting state — no animation wrapper needed */
                    <div className="page-layer static">
                        {displayPage === 'portfolio'
                            ? <SMAChart />
                            : <WatchlistPage />
                        }
                    </div>
                ) : null}
            </div>
        </>
    )
}
