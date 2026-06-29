export interface ShopItem {
  id: string
  name: string
  category: string
  price: number
  emoji: string
  description: string
}

export const CATEGORIES = ['Clothing', 'Bags', 'Accessories', 'Watches', 'Cars', 'Houses', 'Yachts'] as const

export const SHOP_ITEMS: ShopItem[] = [
  // Clothing
  { id: 'hermes-tie', name: 'Hermès Silk Tie', category: 'Clothing', price: 3500, emoji: '👔', description: 'Hand-stitched 100% silk in signature print' },
  { id: 'gucci-coat', name: 'Gucci Wool Coat', category: 'Clothing', price: 8500, emoji: '🧥', description: 'Italian cashmere-wool blend with GG lining' },
  { id: 'lv-jacket', name: 'LV Monogram Jacket', category: 'Clothing', price: 15000, emoji: '🧤', description: 'Louis Vuitton denim jacket, iconic monogram' },
  { id: 'versace-suit', name: 'Versace Gold Suit', category: 'Clothing', price: 22000, emoji: '🤵', description: 'Atelier Versace bespoke gold-thread suit' },
  { id: 'chanel-dress', name: 'Chanel Couture Dress', category: 'Clothing', price: 55000, emoji: '👗', description: 'Haute couture tweed dress from the runway' },

  // Bags
  { id: 'gucci-dionysus', name: 'Gucci Dionysus', category: 'Bags', price: 12000, emoji: '👜', description: 'GG Supreme canvas with tiger-head closure' },
  { id: 'prada-galleria', name: 'Prada Galleria', category: 'Bags', price: 9500, emoji: '💼', description: 'Saffiano leather with gold hardware' },
  { id: 'lv-neverfull', name: 'LV Neverfull MM', category: 'Bags', price: 18000, emoji: '🛍️', description: 'Iconic Monogram canvas, naturally vachetta trim' },
  { id: 'chanel-flap', name: 'Chanel Classic Flap', category: 'Bags', price: 38000, emoji: '👛', description: 'Lambskin with interlocking CC clasp, timeless' },
  { id: 'hermes-birkin', name: 'Hermès Birkin 25', category: 'Bags', price: 45000, emoji: '💎', description: 'Togo leather, palladium hardware — impossible to get' },

  // Accessories
  { id: 'tiffany-ring', name: 'Tiffany Diamond Ring', category: 'Accessories', price: 25000, emoji: '💍', description: '2ct round brilliant in platinum setting' },
  { id: 'cartier-bracelet', name: 'Cartier Love Bracelet', category: 'Accessories', price: 32000, emoji: '📿', description: '18k yellow gold with signature screws' },
  { id: 'vca-necklace', name: 'Van Cleef Necklace', category: 'Accessories', price: 80000, emoji: '✨', description: 'Alhambra motif with ruby and diamonds' },
  { id: 'bvlgari-ring', name: 'Bvlgari B.zero1 Ring', category: 'Accessories', price: 18000, emoji: '🔮', description: 'Iconic spiral design in rose gold' },

  // Watches
  { id: 'rolex-sub', name: 'Rolex Submariner', category: 'Watches', price: 95000, emoji: '⌚', description: 'Oyster, 41mm, Oystersteel, Cerachrom' },
  { id: 'ap-royal-oak', name: 'AP Royal Oak', category: 'Watches', price: 180000, emoji: '🕐', description: 'Audemars Piguet, 37mm, jumbo — the icon' },
  { id: 'patek-nautilus', name: 'Patek Philippe Nautilus', category: 'Watches', price: 250000, emoji: '🕰️', description: 'Reference 5711, porthole-inspired, waiting list: never' },
  { id: 'richard-mille', name: 'Richard Mille RM 11', category: 'Watches', price: 500000, emoji: '⏱️', description: 'Flyback chronograph, skeletonized titanium case' },

  // Cars
  { id: 'porsche-911', name: 'Porsche 911 Turbo S', category: 'Cars', price: 210000, emoji: '🏎️', description: '650 hp, 0–60 in 2.6s, rear-engine perfection' },
  { id: 'ferrari-488', name: 'Ferrari 488 Pista', category: 'Cars', price: 350000, emoji: '🚗', description: '720 hp V8 twin-turbo, track-tuned legend' },
  { id: 'lamborghini', name: 'Lamborghini Huracán', category: 'Cars', price: 320000, emoji: '🚘', description: '630 hp naturally aspirated V10, pure raw' },
  { id: 'rolls-phantom', name: 'Rolls-Royce Phantom', category: 'Cars', price: 650000, emoji: '🚙', description: 'Starlight headliner, bespoke coachwork, silence' },
  { id: 'bugatti-chiron', name: 'Bugatti Chiron', category: 'Cars', price: 3200000, emoji: '💨', description: '1,500 hp, 261 mph, the ultimate hypercar' },

  // Houses
  { id: 'paris-apartment', name: 'Paris Pied-à-Terre', category: 'Houses', price: 5500000, emoji: '🏠', description: 'Haussmann-era apartment, 7th arr., Eiffel view' },
  { id: 'maldives-villa', name: 'Maldives Beach Villa', category: 'Houses', price: 8500000, emoji: '🏡', description: 'Overwater bungalow with infinity pool, private reef' },
  { id: 'monaco-penthouse', name: 'Monaco Penthouse', category: 'Houses', price: 12000000, emoji: '🏢', description: 'Monte-Carlo skyline penthouse, Formula 1 views' },
  { id: 'dubai-palace', name: 'Dubai Palace', category: 'Houses', price: 18000000, emoji: '🏰', description: 'Palm Jumeirah villa, private beach, 12 bedrooms' },
  { id: 'bh-mansion', name: 'Beverly Hills Mansion', category: 'Houses', price: 25000000, emoji: '🏛️', description: 'Mulholland Drive, 15,000 sq ft, infinity pool' },

  // Yachts
  { id: 'sunseeker-76', name: 'Sunseeker 76 Yacht', category: 'Yachts', price: 2800000, emoji: '⛵', description: 'Sleek flybridge, 1,800 nm range, 5 cabins' },
  { id: 'ferretti-960', name: 'Ferretti 960', category: 'Yachts', price: 5200000, emoji: '🛥️', description: 'Tri-deck, full-beam master suite, sky lounge' },
  { id: 'azimut-35', name: 'Azimut Grande 35M', category: 'Yachts', price: 8500000, emoji: '🚢', description: 'Full carbon construction, 6 cabins, Volvo IPS' },
  { id: 'amels-superyacht', name: 'Amels 180 Superyacht', category: 'Yachts', price: 45000000, emoji: '🛳️', description: '55m superyacht, helipad, beach club, 12 guests' },
]
