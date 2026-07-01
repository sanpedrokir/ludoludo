'use client'

import { useState, useTransition } from 'react'
import { buyItem } from '@/lib/actions/shop'

const G = '#C9A96E'
const GL = '#E8D5A3'
const DIM = '#6b5c3e'

export const SHOP_ITEMS = [
  // ── Timepieces ──────────────────────────────────────────────────────
  { id: 'tag',          name: 'TAG Heuer Monaco',             price:   100_000, desc: 'The racing square — worn by Steve McQueen',      tier: 'I',   category: 'Timepieces' },
  { id: 'omega',        name: 'Omega Seamaster',              price:   150_000, desc: "Bond's choice — timeless precision",             tier: 'I',   category: 'Timepieces' },
  { id: 'breitling',    name: 'Breitling Navitimer',          price:   180_000, desc: "The pilot's companion since 1952",               tier: 'I',   category: 'Timepieces' },
  { id: 'iwc',          name: 'IWC Portugieser',              price:   220_000, desc: 'Portuguese soul, Swiss precision',               tier: 'I',   category: 'Timepieces' },
  { id: 'cartier',      name: 'Cartier Santos',               price:   250_000, desc: "The world's first wristwatch, reimagined",       tier: 'I',   category: 'Timepieces' },
  { id: 'jlc',          name: 'Jaeger-LeCoultre Reverso',     price:   280_000, desc: 'A flip of Art Deco genius',                     tier: 'I',   category: 'Timepieces' },
  { id: 'rolex',        name: 'Rolex Submariner',             price:   300_000, desc: 'The icon that defined the dress watch',          tier: 'I',   category: 'Timepieces' },
  { id: 'hublot',       name: 'Hublot Big Bang',              price:   500_000, desc: 'The art of fusion — bold and unmistakable',      tier: 'II',  category: 'Timepieces' },
  { id: 'ap',           name: 'Audemars Piguet Royal Oak',    price:   600_000, desc: 'The original luxury sports watch, 1972',         tier: 'II',  category: 'Timepieces' },
  { id: 'vc',           name: 'Vacheron Constantin Overseas', price:   750_000, desc: "Geneva's oldest Maison since 1755",              tier: 'II',  category: 'Timepieces' },
  { id: 'lange',        name: 'A. Lange & Söhne Saxonia',     price:   900_000, desc: 'German precision at its philosophical peak',     tier: 'II',  category: 'Timepieces' },
  { id: 'patek',        name: 'Patek Philippe Nautilus',      price: 1_200_000, desc: "Rarer than rare — a collector's obsession",      tier: 'II',  category: 'Timepieces' },
  { id: 'rm',           name: 'Richard Mille RM 011',         price: 1_500_000, desc: 'A Formula 1 car compressed onto your wrist',     tier: 'III', category: 'Timepieces' },
  { id: 'fpj',          name: 'F.P. Journe Tourbillon',       price: 2_500_000, desc: 'Only 200 made — the watchmaker\'s life work',    tier: 'III', category: 'Timepieces' },
  { id: 'patek_grand',  name: 'Patek Grand Complication',     price: 4_000_000, desc: 'The summit of 175 years of Swiss horology',      tier: 'III', category: 'Timepieces' },
  { id: 'greubel',      name: 'Greubel Forsey Tourbillon',    price: 5_000_000, desc: 'The most complex wristwatch ever conceived',     tier: 'III', category: 'Timepieces' },

  // ── Leather Goods ────────────────────────────────────────────────────
  { id: 'lv',           name: 'Louis Vuitton Neverfull',      price:   200_000, desc: 'The monogram that defined an era',               tier: 'I',   category: 'Leather Goods' },
  { id: 'gucci_bag',    name: 'Gucci Diana Tote',             price:   300_000, desc: 'Italian craftsmanship, Roman elegance',          tier: 'I',   category: 'Leather Goods' },
  { id: 'chanel_bag',   name: 'Chanel Classic Flap',          price:   500_000, desc: "Coco's greatest gift to fashion",                tier: 'II',  category: 'Leather Goods' },
  { id: 'hermes',       name: 'Hermès Birkin 25',             price:   900_000, desc: "The world's most coveted handbag",               tier: 'II',  category: 'Leather Goods' },
  { id: 'hermes_h',     name: 'Hermès Himalaya Birkin',       price: 4_500_000, desc: 'The holy grail — rarer than any diamond',        tier: 'III', category: 'Leather Goods' },

  // ── Footwear ──────────────────────────────────────────────────────────
  { id: 'jimmy_choo',   name: 'Jimmy Choo Heels',             price:   120_000, desc: "Women's — the shoe of red carpets worldwide",   tier: 'I',   category: 'Footwear' },
  { id: 'louboutin',    name: 'Christian Louboutin',          price:   150_000, desc: 'The red sole that changed fashion forever',      tier: 'I',   category: 'Footwear' },
  { id: 'aquazzura',    name: 'Aquazzura Wild Stiletto',       price:   160_000, desc: "Women's — Florence's finest handmade heels",    tier: 'I',   category: 'Footwear' },
  { id: 'manolo',       name: 'Manolo Blahnik',               price:   200_000, desc: "Women's — worn by royalty and screen icons",     tier: 'I',   category: 'Footwear' },
  { id: 'stuart',       name: 'Stuart Weitzman Nudist',       price:   180_000, desc: "Women's — the heel that defined a decade",      tier: 'I',   category: 'Footwear' },
  { id: 'gianvito',     name: 'Gianvito Rossi Plexi',         price:   220_000, desc: "Women's — sculpted in transparent elegance",    tier: 'I',   category: 'Footwear' },
  { id: 'rene',         name: 'René Caovilla Chandelier',     price:   280_000, desc: "Women's — encrusted with Swarovski crystals",   tier: 'I',   category: 'Footwear' },
  { id: 'berluti',      name: 'Berluti Oxford',               price:   400_000, desc: "Men's — hand-patinated Venetian calfskin",      tier: 'II',  category: 'Footwear' },
  { id: 'john_lobb',    name: 'John Lobb Bespoke',            price:   700_000, desc: "Men's — crafted to your foot, for a lifetime",  tier: 'II',  category: 'Footwear' },

  // ── Couture ───────────────────────────────────────────────────────────
  { id: 'gucci_suit',   name: 'Gucci Double-Breasted',        price:   250_000, desc: "Alessandro Michele's vision of modern luxury",   tier: 'I',   category: 'Couture' },
  { id: 'chanel_j',     name: 'Chanel Tweed Jacket',          price:   450_000, desc: "The timeless icon of French style",              tier: 'II',  category: 'Couture' },
  { id: 'dior',         name: 'Dior Haute Couture Gown',      price:   800_000, desc: 'Handmade over 1,000 hours of pure artistry',     tier: 'II',  category: 'Couture' },
  { id: 'savile',       name: 'Savile Row Bespoke Suit',      price: 1_500_000, desc: 'Where kings and prime ministers are dressed',    tier: 'III', category: 'Couture' },

  // ── Automobiles ──────────────────────────────────────────────────────
  { id: 'bmw',          name: 'BMW M5 Competition',           price:   250_000, desc: 'The ultimate sport sedan — refined fury',       tier: 'I',   category: 'Automobiles' },
  { id: 'mercedes',     name: 'Mercedes-AMG GT',              price:   350_000, desc: 'Stuttgart\'s finest grand tourer',               tier: 'I',   category: 'Automobiles' },
  { id: 'porsche',      name: 'Porsche 911 Turbo S',          price:   500_000, desc: 'Perfection, refined over 60 years',             tier: 'II',  category: 'Automobiles' },
  { id: 'lamborghini',  name: 'Lamborghini Huracán',          price:   800_000, desc: 'Born from the bull — untamed Italian power',    tier: 'II',  category: 'Automobiles' },
  { id: 'ferrari',      name: 'Ferrari 296 GTB',              price: 1_000_000, desc: 'Maranello\'s beating heart, distilled',         tier: 'II',  category: 'Automobiles' },
  { id: 'rolls',        name: 'Rolls-Royce Phantom',          price: 1_800_000, desc: 'The pinnacle of automotive craftsmanship',      tier: 'III', category: 'Automobiles' },
  { id: 'bugatti',      name: 'Bugatti Chiron',               price: 4_000_000, desc: '1,500 hp — the fastest road car on Earth',     tier: 'III', category: 'Automobiles' },

  // ── Estates & Travel ─────────────────────────────────────────────────
  { id: 'diamond',      name: 'Diamond Ring',                 price:   100_000, desc: 'The purest expression of brilliance',            tier: 'I',   category: 'Estates & Travel' },
  { id: 'supercar',     name: 'Grand Tourer',                 price:   200_000, desc: 'Zero to 100 in 2.9 seconds',                    tier: 'I',   category: 'Estates & Travel' },
  { id: 'yacht',        name: 'Mega Yacht',                   price:   300_000, desc: 'Rule the open seas in absolute style',           tier: 'I',   category: 'Estates & Travel' },
  { id: 'penthouse',    name: 'Penthouse',                    price:   500_000, desc: 'Sky-high views, a life above all',               tier: 'II',  category: 'Estates & Travel' },
  { id: 'jet',          name: 'Private Jet',                  price:   800_000, desc: 'The world, on your schedule',                   tier: 'II',  category: 'Estates & Travel' },
  { id: 'crown',        name: 'Royal Crown',                  price: 1_000_000, desc: 'For those who were born to reign',               tier: 'II',  category: 'Estates & Travel' },
  { id: 'mansion',      name: 'Grand Mansion',                price: 2_000_000, desc: '50 rooms, 10 acres — pure distinction',          tier: 'III', category: 'Estates & Travel' },
  { id: 'space',        name: 'Space Voyage',                 price: 3_000_000, desc: 'Orbit Earth — the ultimate symbol',              tier: 'III', category: 'Estates & Travel' },
  { id: 'island',       name: 'Private Island',               price: 5_000_000, desc: 'Your own paradise. No neighbours.',              tier: 'III', category: 'Estates & Travel' },
]

const CATEGORIES = ['Timepieces', 'Leather Goods', 'Footwear', 'Couture', 'Automobiles', 'Estates & Travel']

const TIER_LABEL: Record<string, string> = {
  'I':   'COLLECTION I',
  'II':  'COLLECTION II',
  'III': 'COLLECTION III',
}

function Icon({ id, size = 30 }: { id: string; size?: number }) {
  const s = { fill: 'none', stroke: G, strokeWidth: 1.3, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

  // ── Timepieces ──
  if (['tag','omega','breitling','iwc','cartier','jlc','rolex','hublot','ap','vc','lange','patek','rm','fpj','patek_grand','greubel'].includes(id)) return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="13" y="2" width="6" height="4" rx="1" {...s}/>
      <rect x="13" y="26" width="6" height="4" rx="1" {...s}/>
      <circle cx="16" cy="16" r="10" {...s}/>
      <circle cx="16" cy="16" r="7" {...s}/>
      <path d="M16 12v4l3 2" {...s}/>
      {['patek','patek_grand','rm','fpj','greubel'].includes(id) && <circle cx="16" cy="16" r="1.5" fill={G}/>}
    </svg>
  )

  // ── Leather Goods ──
  if (id === 'lv' || id === 'gucci_bag' || id === 'chanel_bag' || id === 'hermes' || id === 'hermes_h') return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M11 13C11 9 12 7 16 7C20 7 21 9 21 13" {...s}/>
      <rect x="6" y="13" width="20" height="15" rx="2" {...s}/>
      <path d="M6 19h20" {...s}/>
      <path d="M14 19v2h4v-2" {...s}/>
      {(id === 'hermes' || id === 'hermes_h') && <path d="M13 16h6" {...s}/>}
    </svg>
  )

  // ── Footwear ──
  if (['louboutin','manolo','berluti','john_lobb','jimmy_choo','aquazzura','stuart','gianvito','rene'].includes(id)) return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M4 24C4 24 8 26 16 26C22 26 28 24 28 24" {...s}/>
      <path d="M28 24L26 18C24 14 18 12 14 13C10 14 6 17 4 24" {...s}/>
      <path d="M26 18L28 12L24 11" {...s}/>
      {(id === 'louboutin' || id === 'manolo') && <path d="M4 24C4 24 6 22 8 23" {...{ ...s, stroke: id === 'louboutin' ? '#c0392b' : G }}/>}
    </svg>
  )

  // ── Couture ──
  if (id === 'gucci_suit' || id === 'chanel_j' || id === 'dior' || id === 'savile') return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M12 4L6 10L10 12V28H22V12L26 10L20 4L16 9L12 4Z" {...s}/>
      <path d="M16 9V28" {...s}/>
      <path d="M10 12L4 28" {...s}/>
      <path d="M22 12L28 28" {...s}/>
      <path d="M12 16h3M17 16h3" {...s}/>
    </svg>
  )

  // ── Automobiles ──
  if (['bmw','mercedes','porsche','lamborghini','ferrari','rolls','bugatti'].includes(id)) return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M3 22h26" {...s}/>
      <path d="M3 22c0 0 1-5 4-7h18c3 2 4 7 4 7" {...s}/>
      <path d="M8 15l3-6h10l3 6" {...s}/>
      <circle cx="9" cy="24" r="2.5" stroke={G} strokeWidth="1.3" fill="none"/>
      <circle cx="23" cy="24" r="2.5" stroke={G} strokeWidth="1.3" fill="none"/>
      {(id === 'rolls' || id === 'bugatti') && <path d="M13 15h6" {...s}/>}
    </svg>
  )

  // ── Estates & Travel (existing icons) ──
  if (id === 'diamond') return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M16 4L24 13L16 28L8 13Z" {...s}/><path d="M8 13H24" {...s}/><path d="M11 13L16 4M21 13L16 4" {...s}/>
    </svg>
  )
  if (id === 'supercar') return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M3 21h26M3 21c0 0 2-5 5-5h12l5 5" {...s}/><path d="M11 16l3-5h4l3 5" {...s}/>
      <circle cx="9" cy="23" r="2" stroke={G} strokeWidth="1.3" fill="none"/><circle cx="23" cy="23" r="2" stroke={G} strokeWidth="1.3" fill="none"/>
    </svg>
  )
  if (id === 'yacht') return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M16 5V20" {...s}/><path d="M16 5L27 18H16" {...s}/><path d="M5 25h22c-2-4-6-5-11-5s-9 1-11 5Z" {...s}/><path d="M4 28h24" {...s}/>
    </svg>
  )
  if (id === 'penthouse') return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M3 28V14L16 5l13 9v14H3Z" {...s}/><rect x="13" y="20" width="6" height="8" stroke={G} strokeWidth="1.3" fill="none"/>
      <rect x="6" y="16" width="4" height="5" stroke={G} strokeWidth="1.3" fill="none"/><rect x="22" y="16" width="4" height="5" stroke={G} strokeWidth="1.3" fill="none"/>
    </svg>
  )
  if (id === 'jet') return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M4 16L24 11l5 5-5 5L4 16Z" {...s}/><path d="M11 16L7 10M11 16L7 22" {...s}/><path d="M23 13l2-4M23 19l2 4" {...s}/>
    </svg>
  )
  if (id === 'crown') return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M4 26V16l6 7 6-12 6 12 6-7v10H4Z" {...s}/><path d="M4 26h24" {...s}/>
      <circle cx="4" cy="16" r="1.8" fill={G}/><circle cx="16" cy="11" r="1.8" fill={G}/><circle cx="28" cy="16" r="1.8" fill={G}/>
    </svg>
  )
  if (id === 'mansion') return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M2 28V15l7-9h14l7 9v13H2Z" {...s}/><rect x="13" y="20" width="6" height="8" stroke={G} strokeWidth="1.3" fill="none"/>
      <rect x="5" y="17" width="5" height="5" stroke={G} strokeWidth="1.3" fill="none"/><rect x="22" y="17" width="5" height="5" stroke={G} strokeWidth="1.3" fill="none"/>
      <path d="M9 6l7-4 7 4" {...s}/><path d="M2 28h28" {...s}/>
    </svg>
  )
  if (id === 'space') return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M16 3C12 3 9 7 9 13v7l-3 5h3l2-2 5 2 5-2 2 2h3l-3-5v-7C23 7 20 3 16 3Z" {...s}/>
      <circle cx="16" cy="11" r="2.5" stroke={G} strokeWidth="1.3" fill="none"/><path d="M11 27L9 31M21 27L23 31" {...s}/>
    </svg>
  )
  if (id === 'island') return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M16 6C16 6 11 11 11 16h10c0-5-5-10-5-10Z" {...s}/><path d="M11 11L8 6M21 11L24 6" {...s}/>
      <path d="M11 16h10" {...s}/><path d="M6 21c3-3 7-3 10-3s7 0 10 3" {...s}/><path d="M4 26c4-3 8-4 12-4s8 1 12 4" {...s}/>
    </svg>
  )
  return null
}

interface Props {
  balance: number
  ownedIds: string[]
}

export default function ShopClient({ balance, ownedIds }: Props) {
  const [owned, setOwned] = useState<Set<string>>(new Set(ownedIds))
  const [bal, setBal] = useState(balance)
  const [tab, setTab] = useState<'shop' | 'collection'>('shop')
  const [activeCategory, setActiveCategory] = useState<string>(CATEGORIES[0])
  const [feedback, setFeedback] = useState<{ id: string; msg: string; ok: boolean } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleBuy(item: typeof SHOP_ITEMS[0]) {
    startTransition(async () => {
      const res = await buyItem(item.id, item.price)
      if (res.error) {
        setFeedback({ id: item.id, msg: res.error, ok: false })
      } else {
        setOwned(prev => new Set([...prev, item.id]))
        setBal(prev => prev - item.price)
        setFeedback({ id: item.id, msg: `${item.name} added to your collection.`, ok: true })
      }
      setTimeout(() => setFeedback(null), 3500)
    })
  }

  const collectionItems = SHOP_ITEMS.filter(i => owned.has(i.id))
  const visibleItems = SHOP_ITEMS.filter(i => i.category === activeCategory)

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100%' }} className="flex flex-col">
      <div className="w-full max-w-md mx-auto flex flex-col">

      {/* Header */}
      <div className="px-5 pt-7 pb-4">
        <div style={{ color: '#3a3a3a', fontSize: 10, letterSpacing: '0.3em' }} className="uppercase mb-2">Ludo Maison</div>
        <div className="flex items-end justify-between">
          <h1 style={{ color: GL, fontWeight: 300, fontSize: 26, letterSpacing: '0.08em', fontFamily: 'Georgia, serif' }}>The Boutique</h1>
          <div style={{ borderBottom: `1px solid ${DIM}`, paddingBottom: 4 }}>
            <span style={{ color: '#555', fontSize: 10, letterSpacing: '0.2em' }}>BALANCE </span>
            <span style={{ color: G, fontSize: 14, fontWeight: 600, letterSpacing: '0.05em' }}>${bal.toLocaleString()}</span>
          </div>
        </div>
        <div style={{ height: 1, background: `linear-gradient(to right, ${G}, transparent)`, marginTop: 12 }} />
      </div>

      {/* Main tabs */}
      <div className="flex gap-8 px-5 pb-2">
        {(['shop', 'collection'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            color: tab === t ? GL : '#444',
            paddingBottom: 6,
            letterSpacing: '0.2em',
            fontSize: 11,
            fontWeight: 500,
            background: 'none',
            border: 'none',
            borderBottom: tab === t ? `1px solid ${G}` : '1px solid transparent',
            cursor: 'pointer',
            transition: 'color 0.2s',
          }}>
            {t === 'shop' ? 'BOUTIQUE' : `CABINET${collectionItems.length > 0 ? ` (${collectionItems.length})` : ''}`}
          </button>
        ))}
      </div>

      {tab === 'shop' && (
        <>
          {/* Category pills */}
          <div className="flex flex-wrap gap-2 px-5 pb-4">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                background: activeCategory === cat ? G : 'none',
                color: activeCategory === cat ? '#0a0a0a' : '#555',
                border: `1px solid ${activeCategory === cat ? G : '#2a2a2a'}`,
                padding: '4px 12px',
                fontSize: 10,
                letterSpacing: '0.12em',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontWeight: activeCategory === cat ? 600 : 400,
              }}>
                {cat.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Items */}
          <div className="px-5 flex flex-col" style={{ gap: 1 }}>
            {visibleItems.map((item, idx) => {
              const isOwned = owned.has(item.id)
              const canAfford = bal >= item.price
              const isBuying = isPending && feedback?.id === item.id
              const showTierDivider = idx === 0 || visibleItems[idx - 1].tier !== item.tier

              return (
                <div key={item.id}>
                  {showTierDivider && (
                    <div className="flex items-center gap-3" style={{ marginBottom: 8, marginTop: idx === 0 ? 0 : 16 }}>
                      <div style={{ height: 1, background: '#1a1a1a', flex: 1 }} />
                      <span style={{ color: '#3a3a3a', fontSize: 9, letterSpacing: '0.25em' }}>{TIER_LABEL[item.tier]}</span>
                      <div style={{ height: 1, background: '#1a1a1a', flex: 1 }} />
                    </div>
                  )}
                  <div style={{ borderBottom: '1px solid #1a1a1a', padding: '14px 0', opacity: isOwned ? 0.55 : 1 }} className="flex items-center gap-4">
                    <div style={{ flexShrink: 0, opacity: isOwned ? 0.5 : 1 }}>
                      <Icon id={item.id} size={30} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: isOwned ? '#555' : GL, fontSize: 12, letterSpacing: '0.12em', fontWeight: 500 }}>
                        {item.name.toUpperCase()}
                      </div>
                      <div style={{ color: '#444', fontSize: 10, marginTop: 3, letterSpacing: '0.03em' }}>{item.desc}</div>
                      {feedback?.id === item.id && (
                        <div style={{ fontSize: 10, marginTop: 4, color: feedback.ok ? '#6db56d' : '#c44', letterSpacing: '0.03em' }}>{feedback.msg}</div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2" style={{ flexShrink: 0 }}>
                      <div style={{ color: isOwned ? '#3a3a3a' : G, fontSize: 11, fontWeight: 600, letterSpacing: '0.04em' }}>
                        ${item.price.toLocaleString()}
                      </div>
                      {isOwned ? (
                        <div style={{ fontSize: 10, color: '#3a6a3a', letterSpacing: '0.15em' }}>ACQUIRED</div>
                      ) : (
                        <button
                          onClick={() => handleBuy(item)}
                          disabled={!canAfford || isBuying}
                          style={{
                            border: `1px solid ${canAfford ? G : '#2a2a2a'}`,
                            color: canAfford ? G : '#333',
                            background: 'none',
                            fontSize: 9,
                            letterSpacing: '0.15em',
                            padding: '4px 8px',
                            cursor: canAfford ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s',
                            fontWeight: 500,
                          }}
                          onMouseEnter={e => { if (canAfford) { (e.target as HTMLElement).style.background = G; (e.target as HTMLElement).style.color = '#0a0a0a' } }}
                          onMouseLeave={e => { if (canAfford) { (e.target as HTMLElement).style.background = 'none'; (e.target as HTMLElement).style.color = G } }}
                        >
                          {isBuying ? '···' : canAfford ? 'ACQUIRE' : 'UNAFFORDABLE'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Collection tab */}
      {tab === 'collection' && (
        <div className="px-5">
          {collectionItems.length === 0 ? (
            <div className="text-center py-20">
              <div style={{ color: '#2a2a2a', fontSize: 32, marginBottom: 16 }}>◇</div>
              <p style={{ color: '#333', fontSize: 11, letterSpacing: '0.2em' }}>YOUR CABINET IS EMPTY</p>
              <p style={{ color: '#2a2a2a', fontSize: 10, marginTop: 8, letterSpacing: '0.1em' }}>Win games · Earn balance · Acquire pieces</p>
            </div>
          ) : (
            <>
              <p style={{ color: '#333', fontSize: 9, letterSpacing: '0.3em', marginBottom: 16, textAlign: 'center' }}>
                {collectionItems.length} PIECE{collectionItems.length !== 1 ? 'S' : ''} IN YOUR POSSESSION
              </p>
              {CATEGORIES.map(cat => {
                const catItems = collectionItems.filter(i => i.category === cat)
                if (catItems.length === 0) return null
                return (
                  <div key={cat}>
                    <div className="flex items-center gap-3" style={{ marginBottom: 8, marginTop: 16 }}>
                      <div style={{ height: 1, background: '#1a1a1a', flex: 1 }} />
                      <span style={{ color: '#3a3a3a', fontSize: 9, letterSpacing: '0.25em' }}>{cat.toUpperCase()}</span>
                      <div style={{ height: 1, background: '#1a1a1a', flex: 1 }} />
                    </div>
                    {catItems.map(item => (
                      <div key={item.id} style={{ borderBottom: '1px solid #1a1a1a', padding: '14px 0' }} className="flex items-center gap-4">
                        <Icon id={item.id} size={26} />
                        <div style={{ flex: 1 }}>
                          <div style={{ color: G, fontSize: 11, letterSpacing: '0.12em', fontWeight: 500 }}>{item.name.toUpperCase()}</div>
                          <div style={{ color: '#3a3a3a', fontSize: 10, marginTop: 2, letterSpacing: '0.04em' }}>{TIER_LABEL[item.tier]}</div>
                        </div>
                        <div style={{ color: '#2a6a2a', fontSize: 12 }}>✓</div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </>
          )}
        </div>
      )}

      <div style={{ height: 32 }} />
      </div>
    </div>
  )
}
