import {
  Smartphone,
  Car,
  Home,
  Shirt,
  Building,
  Bike,
  Briefcase,
  Baby,
  PawPrint,
  Palette
} from 'lucide-react';

// Single source of truth for the 10 marketplace categories — shared by the
// create-listing wizard, the homepage quick-filter chips, and the homepage
// category grid, so they never drift out of sync with each other.
const RAW_CATEGORIES = [
  { id: 'electronics', emoji: '📱', name: 'Multimédia & High-Tech', desc: 'Smartphones, PC portable, Consoles, TV, Tablettes...', icon: Smartphone },
  { id: 'vehicles', emoji: '🚗', name: 'Véhicules & Pièces Auto', desc: 'Voitures, Motos, Camions, Pièces de rechange...', icon: Car },
  { id: 'home', emoji: '🏠', name: 'Maison, Jardin & Déco', desc: 'Meubles, Électroménager, Bricolage, Jardinage...', icon: Home },
  { id: 'fashion', emoji: '👗', name: 'Mode, Vêtements & Accessoires', desc: 'Friperie, Chaussures, Sacs, Montres, Bijoux...', icon: Shirt },
  { id: 'realestate', emoji: '🏢', name: 'Immobilier (Vente & Location)', desc: 'Appartements, Villas, Terrains, Bureaux, Studios...', icon: Building },
  { id: 'sports', emoji: '⚽', name: 'Sports, Loisirs & Vélos', desc: 'Vélos, Musculation, Camping, Instruments de musique...', icon: Bike },
  { id: 'jobs', emoji: '💼', name: 'Emploi, Services & Cours', desc: "Offres d'emploi, Services à domicile, Cours particuliers...", icon: Briefcase },
  { id: 'baby', emoji: '👶', name: 'Bébé, Enfants & Jouets', desc: 'Poussettes, Sièges auto, Jouets, Vêtements bébé...', icon: Baby },
  { id: 'pets', emoji: '🐾', name: 'Animaux & Accessoires', desc: 'Chiens, Chats, Oiseaux, Alimentation, Accessoires...', icon: PawPrint },
  { id: 'art', emoji: '🎨', name: 'Art, Collection & Antiquités', desc: 'Tableaux, Sculptures, Pièces anciennes, Antiquités...', icon: Palette }
];

// `label` (emoji + name combined) kept alongside the split emoji/name for
// call sites that were already using the single-string form.
export const CATEGORIES = RAW_CATEGORIES.map(c => ({ ...c, label: `${c.emoji} ${c.name}` }));
