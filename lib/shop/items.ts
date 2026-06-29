export interface ShopItem {
  id: string
  name: string
  category: string
  price: number
  emoji: string
  description: string
}

export const CATEGORIES = ['Bags', 'Shoes', 'Clothing', 'Accessories', 'Watches', 'Cars', 'Houses', 'Yachts'] as const

export const SHOP_ITEMS: ShopItem[] = [

  // ── BAGS ──────────────────────────────────────────────────────────────────
  // Hermès
  { id: 'hermes-birkin-25',   name: 'Hermès Birkin 25',        category: 'Bags', price: 45000,  emoji: '👜', description: 'Togo leather, gold hardware — impossible to get' },
  { id: 'hermes-birkin-35',   name: 'Hermès Birkin 35',        category: 'Bags', price: 55000,  emoji: '👜', description: 'Epsom leather, palladium hardware, classic orange box' },
  { id: 'hermes-kelly-28',    name: 'Hermès Kelly 28',         category: 'Bags', price: 38000,  emoji: '💼', description: 'Sellier, black box calf, timeless Princess Grace silhouette' },
  { id: 'hermes-constance',   name: 'Hermès Constance 24',     category: 'Bags', price: 32000,  emoji: '👛', description: 'Evercolor leather, iconic H-buckle closure' },
  // Louis Vuitton
  { id: 'lv-neverfull',       name: 'LV Neverfull MM',         category: 'Bags', price: 18000,  emoji: '🛍️', description: 'Monogram canvas, vachetta trim, the eternal tote' },
  { id: 'lv-capucines',       name: 'LV Capucines BB',         category: 'Bags', price: 27000,  emoji: '👜', description: 'Taurillon leather, LV signature in solid metal' },
  { id: 'lv-speedy-30',       name: 'LV Speedy Bandoulière',   category: 'Bags', price: 14000,  emoji: '💼', description: 'Damier Ebene canvas with detachable shoulder strap' },
  { id: 'lv-pochette',        name: 'LV Pochette Métis',       category: 'Bags', price: 22000,  emoji: '👛', description: 'Monogram Empreinte leather, elegant flap-over style' },
  // Dior
  { id: 'dior-lady-dior',     name: 'Dior Lady Dior MM',       category: 'Bags', price: 35000,  emoji: '👜', description: 'Cannage quilted lambskin, favoured by Princess Diana' },
  { id: 'dior-book-tote',     name: 'Dior Book Tote',          category: 'Bags', price: 20000,  emoji: '🛍️', description: 'Toile de Jouy embroidery, large structured shopper' },
  { id: 'dior-saddle',        name: 'Dior Saddle Bag',         category: 'Bags', price: 24000,  emoji: '👛', description: 'Oblique jacquard, distinctive D-ring buckle, iconic shape' },
  // Chanel
  { id: 'chanel-classic-flap', name: 'Chanel Classic Flap M',  category: 'Bags', price: 42000,  emoji: '💎', description: 'Lambskin, interlocking CC clasp, gold chain — the ultimate' },
  { id: 'chanel-19',          name: 'Chanel 19 Bag',           category: 'Bags', price: 29000,  emoji: '👜', description: 'Quilted leather, mixed-metal chain, launched 2019 runway' },
  { id: 'chanel-boy',         name: 'Chanel Boy Bag',          category: 'Bags', price: 33000,  emoji: '👛', description: 'Double-stitched calfskin, aged silver hardware, edgy icon' },

  // ── SHOES ─────────────────────────────────────────────────────────────────
  { id: 'hermes-oran',        name: 'Hermès Oran Sandals',     category: 'Shoes', price: 8500,  emoji: '👡', description: 'Calfskin H-cut flat sandal, summer staple of the ultra-rich' },
  { id: 'hermes-derby',       name: 'Hermès Derby Oxford',     category: 'Shoes', price: 11000, emoji: '👞', description: 'Hand-stitched box calf, rubber Hermès sole, Parisian refinement' },
  { id: 'hermes-izmir',       name: 'Hermès Izmir Sandal',     category: 'Shoes', price: 7500,  emoji: '🩴', description: 'Epsom calfskin thong sandal with iconic H motif' },
  { id: 'louboutin-heels',    name: 'Louboutin So Kate 120',   category: 'Shoes', price: 9000,  emoji: '👠', description: 'Patent leather pump, stiletto heel, signature red sole' },
  { id: 'manolo-bb',          name: 'Manolo Blahnik BB 105',   category: 'Shoes', price: 8200,  emoji: '👠', description: 'Nude suede pointy-toe pump, the shoe Sex and the City made famous' },
  { id: 'gucci-horsebit',     name: 'Gucci Horsebit Loafer',   category: 'Shoes', price: 6500,  emoji: '👞', description: 'GG canvas with horsebit detail, timeless since 1953' },
  { id: 'jimmy-choo-pumps',   name: 'Jimmy Choo Romy 100',     category: 'Shoes', price: 7000,  emoji: '👡', description: 'Patent leather pointed-toe pump, Hollywood red-carpet staple' },

  // ── CLOTHING ──────────────────────────────────────────────────────────────
  { id: 'hermes-scarf',       name: 'Hermès Carré Silk Scarf', category: 'Clothing', price: 6500,  emoji: '🧣', description: '90cm hand-rolled silk twill, each an artistic masterpiece' },
  { id: 'lv-jacket',          name: 'LV Monogram Jacket',      category: 'Clothing', price: 15000, emoji: '🧥', description: 'Iconic Monogram denim jacket from the Louis Vuitton Men runway' },
  { id: 'gucci-coat',         name: 'Gucci Wool Coat',         category: 'Clothing', price: 8500,  emoji: '🧥', description: 'Italian cashmere-wool blend with GG lining, Florentine craft' },
  { id: 'versace-suit',       name: 'Versace Atelier Suit',    category: 'Clothing', price: 22000, emoji: '🤵', description: 'Bespoke gold-thread embroidered suit, Milano Atelier' },
  { id: 'chanel-tweed-dress', name: 'Chanel Couture Dress',    category: 'Clothing', price: 55000, emoji: '👗', description: 'Haute couture runway tweed dress, each button hand-sewn' },
  { id: 'dior-bar-jacket',    name: 'Dior Bar Jacket',         category: 'Clothing', price: 12000, emoji: '🧥', description: 'New Look silhouette in cream wool barathea, timeless Dior' },

  // ── ACCESSORIES ───────────────────────────────────────────────────────────
  { id: 'tiffany-ring',       name: 'Tiffany Diamond Ring',    category: 'Accessories', price: 25000,  emoji: '💍', description: '2ct round brilliant in platinum setting, Tiffany blue box' },
  { id: 'cartier-love',       name: 'Cartier Love Bracelet',   category: 'Accessories', price: 32000,  emoji: '📿', description: '18k yellow gold, signature screw motif, needs a screwdriver to remove' },
  { id: 'vca-necklace',       name: 'Van Cleef Alhambra',      category: 'Accessories', price: 80000,  emoji: '✨', description: 'Vintage Alhambra necklace, 10 motifs in mother-of-pearl and gold' },
  { id: 'bvlgari-bzero',      name: 'Bvlgari B.zero1 Ring',    category: 'Accessories', price: 18000,  emoji: '🔮', description: 'Rose gold spiral architecture, inspired by the Colosseum' },
  { id: 'hermes-h-belt',      name: 'Hermès H Belt 32mm',      category: 'Accessories', price: 9500,   emoji: '👔', description: 'Box calfskin with iconic H buckle in gold hardware, reversible' },

  // ── WATCHES ───────────────────────────────────────────────────────────────
  // Rolex
  { id: 'rolex-sub',          name: 'Rolex Submariner',        category: 'Watches', price: 95000,  emoji: '⌚', description: 'Ref. 126610LN — 41mm, black ceramic bezel, Oystersteel' },
  { id: 'rolex-daytona',      name: 'Rolex Cosmograph Daytona', category: 'Watches', price: 180000, emoji: '⏱️', description: 'Ref. 116500LN — white dial, ceramic bezel, the race icon' },
  { id: 'rolex-day-date',     name: 'Rolex Day-Date 40',       category: 'Watches', price: 145000, emoji: '🕐', description: '18k yellow gold, President bracelet — the "President\'s watch"' },
  { id: 'rolex-gmt',          name: 'Rolex GMT-Master II',     category: 'Watches', price: 130000, emoji: '🕰️', description: 'Ref. 126710BLRO — Pepsi bezel, Jubilee bracelet, two time zones' },
  { id: 'rolex-yacht-master', name: 'Rolex Yacht-Master 42',   category: 'Watches', price: 115000, emoji: '⏲️', description: 'Platinum and Oystersteel, rotatable bidirectional bezel, nautical spirit' },
  // Patek Philippe
  { id: 'patek-nautilus',     name: 'Patek Nautilus 5711',     category: 'Watches', price: 250000, emoji: '💎', description: 'Ref. 5711/1A-010 — steel with blue dial, the most coveted watch alive' },
  { id: 'patek-calatrava',    name: 'Patek Calatrava 5196',    category: 'Watches', price: 110000, emoji: '🕰️', description: 'Ref. 5196G — white gold, cream dial, ultra-thin dress watch perfection' },
  { id: 'patek-grand-compl',  name: 'Patek Grand Complications', category: 'Watches', price: 480000, emoji: '⌛', description: 'Ref. 5270G — perpetual calendar, split-second chronograph, white gold' },
  { id: 'patek-world-time',   name: 'Patek World Time 5230',   category: 'Watches', price: 210000, emoji: '🌍', description: 'Ref. 5230G — 24 time zones on one dial, cloisonné enamel world map' },
  // Other
  { id: 'ap-royal-oak',       name: 'AP Royal Oak 37mm',       category: 'Watches', price: 180000, emoji: '⌚', description: 'Audemars Piguet — jumbo, porthole case, iconic tapisserie dial' },
  { id: 'richard-mille',      name: 'Richard Mille RM 11-03',  category: 'Watches', price: 500000, emoji: '🔬', description: 'Flyback chronograph, titanium tonneau, worn by Rafael Nadal' },

  // ── CARS ─────────────────────────────────────────────────────────────────
  // BMW
  { id: 'bmw-m3',             name: 'BMW M3 Competition',      category: 'Cars', price: 95000,   emoji: '🚗', description: '510 hp inline-6 turbo, M xDrive, the definitive sports sedan' },
  { id: 'bmw-m8',             name: 'BMW M8 Gran Coupé',       category: 'Cars', price: 165000,  emoji: '🚘', description: '617 hp V8, 4-door luxury grand tourer with racetrack DNA' },
  { id: 'bmw-7-series',       name: 'BMW 760i xDrive',         category: 'Cars', price: 185000,  emoji: '🚙', description: 'BMW\'s flagship V8 ultra-luxury saloon with crystal Interior trim' },
  { id: 'bmw-i7',             name: 'BMW i7 M70 xDrive',       category: 'Cars', price: 210000,  emoji: '⚡', description: '650 hp pure-electric luxury limousine, 31" rear theatre screen' },
  // Mercedes-Benz
  { id: 'merc-s-class',       name: 'Mercedes S 580 4MATIC',   category: 'Cars', price: 195000,  emoji: '🚙', description: 'The benchmark luxury saloon — rear-axle steering, 3D Burmester audio' },
  { id: 'merc-amg-gt63',      name: 'Mercedes-AMG GT 63 S',    category: 'Cars', price: 210000,  emoji: '🏎️', description: '630 hp V8 biturbo, 4-door coupé, Nürburgring record setter' },
  { id: 'merc-g-class',       name: 'Mercedes-AMG G 63',       category: 'Cars', price: 225000,  emoji: '🚘', description: '577 hp V8, 40+ year icon, goes anywhere yet arrives in style' },
  { id: 'merc-maybach-s',     name: 'Mercedes-Maybach S 680',  category: 'Cars', price: 350000,  emoji: '🚗', description: 'Extended wheelbase, Executive Rear Seat Package — a private jet on wheels' },
  // Rolls-Royce
  { id: 'rolls-phantom',      name: 'Rolls-Royce Phantom',     category: 'Cars', price: 650000,  emoji: '🏛️', description: 'Gallery dashboard, starlight headliner, absolute silence' },
  { id: 'rolls-ghost',        name: 'Rolls-Royce Ghost',       category: 'Cars', price: 420000,  emoji: '👻', description: 'Illuminated fascia, Planar suspension — post-opulence luxury' },
  { id: 'rolls-cullinan',     name: 'Rolls-Royce Cullinan',    category: 'Cars', price: 480000,  emoji: '🚙', description: 'The only ultra-luxury SUV truly worthy of the Spirit of Ecstasy' },
  // Other exotics
  { id: 'porsche-911',        name: 'Porsche 911 Turbo S',     category: 'Cars', price: 235000,  emoji: '🏎️', description: '650 hp flat-6, 0–60 in 2.6s, perfected over 60 years' },
  { id: 'ferrari-296',        name: 'Ferrari 296 GTB',         category: 'Cars', price: 380000,  emoji: '🔴', description: '830 hp hybrid V6, Assetto Fiorano package, pure Maranello joy' },
  { id: 'lamborghini-urus',   name: 'Lamborghini Urus S',      category: 'Cars', price: 290000,  emoji: '🐂', description: 'The Super SUV — 666 hp twin-turbo V8, Lamborghini drama every day' },
  { id: 'bugatti-chiron',     name: 'Bugatti Chiron Super Sport', category: 'Cars', price: 3800000, emoji: '💨', description: '1,600 hp W16, 273 mph — the fastest production car ever built' },

  // ── HOUSES ────────────────────────────────────────────────────────────────
  { id: 'paris-apartment',    name: 'Paris Pied-à-Terre',      category: 'Houses', price: 5500000,  emoji: '🏠', description: 'Haussmann-era apartment, 7th arrondissement, Eiffel Tower view' },
  { id: 'maldives-villa',     name: 'Maldives Beach Villa',    category: 'Houses', price: 8500000,  emoji: '🏡', description: 'Overwater bungalow, infinity pool, private coral reef' },
  { id: 'monaco-penthouse',   name: 'Monaco Penthouse',        category: 'Houses', price: 12000000, emoji: '🏢', description: 'Monte-Carlo skyline, terrace with Formula 1 circuit views' },
  { id: 'dubai-palace',       name: 'Dubai Palm Palace',       category: 'Houses', price: 18000000, emoji: '🏰', description: 'Palm Jumeirah signature villa, private beach, 12 bedrooms' },
  { id: 'bh-mansion',         name: 'Beverly Hills Mansion',   category: 'Houses', price: 25000000, emoji: '🏛️', description: 'Mulholland Drive, 15,000 sq ft, infinity pool, city lights view' },
  { id: 'hamptons-estate',    name: 'Hamptons Estate',         category: 'Houses', price: 32000000, emoji: '🏡', description: '12-acre oceanfront estate, tennis court, guest house, helipad' },

  // ── YACHTS ────────────────────────────────────────────────────────────────
  { id: 'sunseeker-76',       name: 'Sunseeker 76 Yacht',      category: 'Yachts', price: 2800000,  emoji: '⛵', description: 'Sleek flybridge, 1,800 nm range, 5 cabins, Med-ready' },
  { id: 'ferretti-960',       name: 'Ferretti 960',            category: 'Yachts', price: 5200000,  emoji: '🛥️', description: 'Tri-deck, full-beam master suite, 6 guest cabins, sky lounge' },
  { id: 'azimut-35',          name: 'Azimut Grande 35M',       category: 'Yachts', price: 8500000,  emoji: '🚢', description: 'Full carbon construction, 6 cabins, IPS drives, 28-knot top speed' },
  { id: 'amels-superyacht',   name: 'Amels 180 Superyacht',    category: 'Yachts', price: 45000000, emoji: '🛳️', description: '55m, helipad, beach club, 12 guests, global range — true freedom' },
]
