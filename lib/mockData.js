export const MOCK_CATEGORIES = [
  { id: 'fashion', nameKey: 'catFashion', defaultName: 'Mode & Vêtements', count: '20 000+ articles', icon: 'Shirt', image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=300&q=80' },
  { id: 'electronics', nameKey: 'catElectronics', defaultName: 'Électronique & High-Tech', count: '15 000+ articles', icon: 'Headphones', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80' },
  { id: 'beauty', nameKey: 'catBeauty', defaultName: 'Beauté & Soins', count: '8 000+ articles', icon: 'Sparkles', image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&q=80' },
  { id: 'home', nameKey: 'catHome', defaultName: 'Maison & Déco', count: '12 000+ articles', icon: 'Armchair', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&q=80' },
  { id: 'grocery', nameKey: 'catGrocery', defaultName: 'Épicerie', count: '5 000+ articles', icon: 'ShoppingBag', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=80' },
  { id: 'sports', nameKey: 'catSports', defaultName: 'Sports & Loisirs', count: '9 500+ articles', icon: 'Dumbbell', image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=300&q=80' },
];

export const MOCK_FLASH_DEAL = {
  id: 'flash-1',
  title: 'Apple Watch Series 9 GPS + Cellular',
  description: 'Offre limitée - Montre connectée premium avec capteurs de santé avancés & étanche.',
  specialPrice: 420,
  originalPrice: 650,
  discount: '-35%',
  endsIn: { days: 2, hours: 12, mins: 45, secs: 30 },
  image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&q=80',
  rating: 4.9,
  reviewsCount: 1842,
  seller: {
    id: 'seller-apple',
    name: 'Official Apple Hub',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
    rating: 4.95,
    verified: true,
    location: 'Tunis, Tunisie',
    phone: '+216 98 123 456'
  }
};

export const MOCK_FEATURED_PRODUCTS = [
  {
    id: 'prod-1',
    title: "Baskets de Course Homme Air Sneakers",
    category: 'Mode & Vêtements',
    price: 145,
    originalPrice: 190,
    discountBadge: '-25%',
    rating: 4.8,
    reviewsCount: 1234,
    negotiable: true,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&q=80',
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&q=80'
    ],
    condition: 'Neuf (Scellé)',
    description: 'Tige en maille respirante ultra-légère avec semelle à coussin d air. Parfait pour le sport, la course et le style urbain.',
    seller: {
      id: 'seller-1',
      name: 'SportStyle Officiel',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
      rating: 4.9,
      verified: true,
      location: 'Sousse, Tunisie',
      phone: '+216 55 987 654'
    }
  },
  {
    id: 'prod-2',
    title: 'Écouteurs Sans Fil Pro Réduction de Bruit',
    category: 'Électronique',
    price: 160,
    originalPrice: 220,
    discountBadge: '-20%',
    rating: 4.9,
    reviewsCount: 2631,
    negotiable: true,
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&q=80',
    images: [
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80',
      'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=600&q=80'
    ],
    condition: 'Neuf',
    description: 'Réduction Active du Bruit, Mode Transparence, et 30 heures d autonomie avec étui de charge sans fil.',
    seller: {
      id: 'seller-2',
      name: 'TechLab Store',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80',
      rating: 4.85,
      verified: true,
      location: 'Tunis, Tunisie',
      phone: '+216 22 111 333'
    }
  },
  {
    id: 'prod-3',
    title: 'iPhone 15 Pro Max 256Go Titane',
    category: 'Électronique',
    price: 3450,
    originalPrice: 4200,
    discountBadge: '-18%',
    rating: 4.95,
    reviewsCount: 1200,
    negotiable: true,
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&q=80',
    images: [
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&q=80',
      'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&q=80'
    ],
    condition: 'Comme Neuf (Utilisé 1 mois)',
    description: 'Puce A17 Pro, design en Titane, système photo 48MP avec zoom optique 5x. Vendu avec boîte d origine et chargeur rapide.',
    seller: {
      id: 'seller-3',
      name: 'Youssef Tech',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80',
      rating: 5.0,
      verified: true,
      location: 'Sfax, Tunisie',
      phone: '+216 99 888 777'
    }
  },
  {
    id: 'prod-4',
    title: 'MacBook Air M2 13 pouces 8Go/256Go',
    category: 'Électronique',
    price: 3800,
    originalPrice: 4500,
    discountBadge: '-15%',
    rating: 4.9,
    reviewsCount: 1200,
    negotiable: true,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=80',
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80'
    ],
    condition: 'Neuf Scellé',
    description: 'Design incroyablement fin, écran Liquid Retina, 18 heures d autonomie, couleur Minuit.',
    seller: {
      id: 'seller-2',
      name: 'TechLab Store',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80',
      rating: 4.85,
      verified: true,
      location: 'Tunis, Tunisie'
    }
  },
  {
    id: 'prod-5',
    title: 'Friteuse Sans Huile Air Fryer 4.5L Tactile',
    category: 'Maison & Déco',
    price: 220,
    originalPrice: 290,
    discountBadge: '-24%',
    rating: 4.7,
    reviewsCount: 962,
    negotiable: true,
    image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=500&q=80',
    images: [
      'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=600&q=80'
    ],
    condition: 'Neuf',
    description: '8 modes de cuisson préprogrammés, 85% d huile en moins, panier antiadhésif lavable au lave-vaisselle.',
    seller: {
      id: 'seller-home',
      name: 'Kitchen & Living Co.',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&q=80',
      rating: 4.75,
      verified: true,
      location: 'Nabeul, Tunisie'
    }
  },
  {
    id: 'prod-6',
    title: 'Canapé Moderne 3 Places en Tissu',
    category: 'Maison & Déco',
    price: 850,
    originalPrice: 1100,
    discountBadge: '-22%',
    rating: 4.8,
    reviewsCount: 542,
    negotiable: true,
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&q=80',
    images: [
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80'
    ],
    condition: 'Neuf',
    description: 'Coussins haute densité, structure en bois massif durable, tissu lin gris résistant aux taches.',
    seller: {
      id: 'seller-home',
      name: 'Kitchen & Living Co.',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&q=80',
      rating: 4.75,
      verified: true,
      location: 'Nabeul, Tunisie'
    }
  }
];

export const MOCK_TESTIMONIALS = [
  {
    id: 't-1',
    name: 'Emily Johnson',
    role: 'Acheteuse Vérifiée',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
    quote: '"Excellents produits, livraison très rapide et super service client en Tunisie. Marketly est devenue ma destination shopping préférée !"'
  },
  {
    id: 't-2',
    name: 'Ahmed Ben Ali',
    role: 'Vendeur Certifié',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
    quote: '"Le système de négociation directe en chat m a permis de conclure mes ventes 3x plus vite avec des acheteurs sérieux."'
  }
];

export const MOCK_CHAT_THREADS = [
  {
    id: 'chat-101',
    productId: 'prod-1',
    productTitle: "Baskets de Course Homme Air Sneakers",
    productPrice: 145,
    productImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&q=80',
    otherUser: {
      id: 'seller-1',
      name: 'SportStyle Officiel',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
      status: 'online'
    },
    lastMessage: 'J accepte votre offre de 130 DT ! Vous pouvez valider l achat.',
    lastUpdated: 'Il y a 10 min',
    messages: [
      { id: 'm1', sender: 'them', text: 'Bonjour ! Merci pour votre intérêt. N hésitez pas si vous avez des questions.', timestamp: '10:15' },
      { id: 'm2', sender: 'me', text: 'Bonjour ! Est-ce que le prix est négociable à 130 DT ?', timestamp: '10:18' },
      { id: 'm3', type: 'offer', sender: 'me', amount: 130.00, status: 'accepted', timestamp: '10:20' },
      { id: 'm4', sender: 'them', text: 'J accepte votre offre de 130 DT ! Vous pouvez valider l achat.', timestamp: '10:22' }
    ]
  },
  {
    id: 'chat-102',
    productId: 'prod-3',
    productTitle: 'iPhone 15 Pro Max 256Go Titane',
    productPrice: 3450,
    productImage: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=200&q=80',
    otherUser: {
      id: 'seller-3',
      name: 'Youssef Tech',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80',
      status: 'offline'
    },
    lastMessage: 'Pouvez-vous faire 3200 DT aujourd hui ?',
    lastUpdated: 'Il y a 2 heures',
    messages: [
      { id: 'm10', sender: 'me', text: 'Est-ce que le téléphone est encore sous garantie officielle en Tunisie ?', timestamp: '08:30' },
      { id: 'm11', sender: 'them', text: 'Oui ! Garantie officielle Apple valable jusqu à Décembre 2026.', timestamp: '08:35' },
      { id: 'm12', type: 'offer', sender: 'me', amount: 3200.00, status: 'pending', timestamp: '09:00' },
      { id: 'm13', sender: 'me', text: 'Pouvez-vous faire 3200 DT aujourd hui ?', timestamp: '09:01' }
    ]
  }
];

export const MOCK_USER_PROFILE = {
  id: 'user-77',
  name: 'Hamza K.',
  email: 'hamza.user@tanitmarket.tn',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80',
  rating: 4.9,
  reviewsCount: 34,
  location: 'Tunis, Tunisie',
  memberSince: 'Mars 2024',
  bio: 'Passionné de high-tech et de mode. Réponse rapide & vendeur de confiance.',
  activeListingsCount: 3,
  completedDealsCount: 18,
  wishlistCount: 5
};

export const MOCK_ADMIN_STATS = {
  totalRevenue: 28450,
  activeAnnouncements: 1428,
  totalUsers: 3420,
  pendingOffers: 186,
  revenueGrowth: '+14.5%',
  usersGrowth: '+22.1%'
};

export const MOCK_ADMIN_LISTINGS = [
  {
    id: 'prod-1',
    title: "Baskets de Course Homme Air Sneakers",
    category: 'Mode & Vêtements',
    price: 145,
    sellerName: 'SportStyle Officiel',
    location: 'Sousse',
    status: 'Approuvée',
    date: '13 Sept 2026'
  },
  {
    id: 'prod-3',
    title: 'iPhone 15 Pro Max 256Go Titane',
    category: 'Électronique',
    price: 3450,
    sellerName: 'Youssef Tech',
    location: 'Sfax',
    status: 'Approuvée',
    date: '12 Sept 2026'
  },
  {
    id: 'prod-7',
    title: 'PlayStation 5 Slim 1TB + 2 Manettes',
    category: 'Électronique',
    price: 1850,
    sellerName: 'GamerZone 🇹🇳',
    location: 'Tunis',
    status: 'En attente',
    date: '13 Sept 2026'
  },
  {
    id: 'prod-8',
    title: 'Montre de Luxe Submariner Homme',
    category: 'Mode',
    price: 490,
    sellerName: 'LuxStore',
    location: 'Nabeul',
    status: 'Bannie',
    date: '10 Sept 2026'
  }
];

export const MOCK_ADMIN_USERS = [
  {
    id: 'u-1',
    name: 'Hamza K.',
    email: 'hamza.user@tanitmarket.tn',
    role: 'Vendeur Premium',
    location: 'Tunis',
    status: 'Vérifié',
    joined: 'Mars 2024',
    listings: 8
  },
  {
    id: 'u-2',
    name: 'SportStyle Officiel',
    email: 'contact@sportstyle.tn',
    role: 'Boutique Pro',
    location: 'Sousse',
    status: 'Vérifié',
    joined: 'Jan 2024',
    listings: 42
  },
  {
    id: 'u-3',
    name: 'Youssef Ben Salem',
    email: 'youssef.tech@gmail.com',
    role: 'Particulier',
    location: 'Sfax',
    status: 'Vérifié',
    joined: 'Fév 2025',
    listings: 3
  },
  {
    id: 'u-4',
    name: 'Compte Suspect',
    email: 'spam.user@temp.tn',
    role: 'Particulier',
    location: 'Manouba',
    status: 'Suspendu',
    joined: 'Sept 2026',
    listings: 0
  }
];

import { ALL_TUNISIAN_GOVERNORATES } from './tunisianLocations';

export const TUNISIAN_GOVERNORATES = ALL_TUNISIAN_GOVERNORATES;

