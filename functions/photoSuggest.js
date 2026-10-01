/**
 * Turns Cloud Vision labels into a suggested category and title for a new
 * listing. Pure — the Vision call is in index.js — because the mapping is the
 * part that can be wrong in ways a seller would notice: a phone filed under
 * "Maison", a title that is just "Product".
 *
 * Vision labels are generic English nouns ("Mobile phone", "Couch"), each with
 * a confidence score. A suggestion is only returned when the evidence is clear;
 * otherwise the caller is told there is nothing to suggest and the form stays
 * as it was, which is better than a confident wrong guess.
 */

/** Below this a label is a guess, not a finding. */
const MIN_SCORE = 0.7;

// Category ids are the ones create-listing uses. Keywords are matched against
// whole lowercase label descriptions, so "car" must not fire on "carpet".
const CATEGORY_KEYWORDS = {
  electronics: ['mobile phone', 'smartphone', 'phone', 'laptop', 'computer', 'tablet computer', 'television', 'monitor', 'video game console', 'camera', 'headphones', 'smartwatch', 'electronic device', 'gadget', 'netbook', 'personal computer', 'computer keyboard', 'speaker'],
  vehicles: ['car', 'vehicle', 'motorcycle', 'truck', 'van', 'suv', 'automotive design', 'wheel', 'tire', 'motor vehicle', 'scooter', 'minivan', 'sedan'],
  home: ['furniture', 'couch', 'sofa', 'chair', 'table', 'bed', 'wardrobe', 'shelf', 'lamp', 'refrigerator', 'washing machine', 'kitchen appliance', 'home appliance', 'mattress', 'cabinetry', 'drawer', 'carpet', 'mirror', 'oven', 'microwave oven'],
  fashion: ['clothing', 'shoe', 'footwear', 'sneakers', 'jacket', 'dress', 'handbag', 'bag', 'jeans', 'watch', 'jewellery', 'jewelry', 'sunglasses', 'coat', 'sleeve', 'outerwear', 'boot', 'hat', 'trousers', 'shirt', 't-shirt'],
  realestate: ['house', 'apartment', 'building', 'real estate', 'property', 'condominium', 'residential area', 'land lot', 'room'],
  sports: ['bicycle', 'bike', 'sports equipment', 'guitar', 'musical instrument', 'dumbbell', 'treadmill', 'tent', 'ball', 'football', 'skateboard', 'piano', 'drum', 'exercise equipment', 'fishing rod'],
  baby: ['toy', 'baby carriage', 'stroller', 'baby products', 'child', 'infant', 'doll', 'car seat', 'baby'],
  pets: ['dog', 'cat', 'pet', 'bird', 'fish', 'rabbit', 'hamster', 'dog breed', 'canidae', 'felidae', 'aquarium'],
  art: ['painting', 'sculpture', 'art', 'antique', 'statue', 'picture frame', 'vase', 'visual arts', 'artifact', 'coin'],
};

// Labels too generic to name the object in a title.
const GENERIC = new Set([
  'product', 'material property', 'rectangle', 'font', 'technology', 'electronic device', 'gadget', 'communication device',
  'portable communications device', 'automotive design', 'automotive exterior', 'fashion accessory', 'electric blue',
  'black', 'white', 'grey', 'gray', 'red', 'blue', 'green', 'yellow', 'brown', 'pattern', 'line', 'circle', 'plastic',
  'metal', 'wood', 'cuboid', 'tints and shades', 'still life photography', 'close-up', 'event', 'service', 'machine',
  'fixture', 'comfort', 'houseplant', 'flowerpot', 'floor', 'wall', 'darkness', 'monochrome', 'monochrome photography',
]);

// What a label looks like once it is worth putting in a French title.
const FRENCH = {
  'mobile phone': 'Téléphone portable', smartphone: 'Smartphone', laptop: 'Ordinateur portable', 'netbook': 'Ordinateur portable',
  'personal computer': 'Ordinateur', computer: 'Ordinateur', 'tablet computer': 'Tablette', television: 'Télévision', 'video game console': 'Console de jeux',
  camera: 'Appareil photo', headphones: 'Casque audio', smartwatch: 'Montre connectée', speaker: 'Enceinte',
  car: 'Voiture', motorcycle: 'Moto', truck: 'Camion', van: 'Fourgonnette', scooter: 'Scooter', 'motor vehicle': 'Véhicule',
  couch: 'Canapé', sofa: 'Canapé', chair: 'Chaise', table: 'Table', bed: 'Lit', wardrobe: 'Armoire', shelf: 'Étagère', lamp: 'Lampe',
  refrigerator: 'Réfrigérateur', 'washing machine': 'Machine à laver', mattress: 'Matelas', mirror: 'Miroir', oven: 'Four', 'microwave oven': 'Micro-ondes', furniture: 'Meuble',
  shoe: 'Chaussures', footwear: 'Chaussures', sneakers: 'Baskets', jacket: 'Veste', dress: 'Robe', handbag: 'Sac à main', bag: 'Sac', jeans: 'Jean', watch: 'Montre',
  sunglasses: 'Lunettes de soleil', coat: 'Manteau', boot: 'Bottes', hat: 'Chapeau', shirt: 'Chemise', 't-shirt': 'T-shirt', trousers: 'Pantalon',
  bicycle: 'Vélo', bike: 'Vélo', guitar: 'Guitare', piano: 'Piano', drum: 'Batterie', dumbbell: 'Haltère', treadmill: 'Tapis de course', tent: 'Tente', skateboard: 'Skateboard',
  toy: 'Jouet', stroller: 'Poussette', 'baby carriage': 'Poussette', doll: 'Poupée', 'car seat': 'Siège auto',
  dog: 'Chien', cat: 'Chat', bird: 'Oiseau', rabbit: 'Lapin', hamster: 'Hamster', aquarium: 'Aquarium',
  painting: 'Tableau', sculpture: 'Sculpture', statue: 'Statue', vase: 'Vase', 'picture frame': 'Cadre',
};

const norm = (s) => String(s || '').trim().toLowerCase();

/**
 * @param {Array<{description:string, score:number}>} labels as returned by Vision
 * @returns {{category:string, title:string, labels:string[]} | null}
 */
function suggestFromLabels(labels) {
  const strong = (Array.isArray(labels) ? labels : [])
    .map((l) => ({ name: norm(l?.description), score: Number(l?.score) }))
    .filter((l) => l.name && Number.isFinite(l.score) && l.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score);
  if (strong.length === 0) return null;

  // Each category is scored by the confidence of the labels that name it; the
  // best one wins only if it is not tied with another — a tie is "unclear".
  const scores = {};
  for (const { name, score } of strong) {
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.includes(name)) scores[category] = (scores[category] || 0) + score;
    }
  }
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (ranked.length === 0) return null;
  if (ranked[1] && Math.abs(ranked[0][1] - ranked[1][1]) < 0.05) return null;
  const category = ranked[0][0];

  // The title names the most confident label we can say in French and that is
  // not generic; falling back to nothing, not to an English label.
  const noun = strong.find((l) => FRENCH[l.name] && !GENERIC.has(l.name));
  return {
    category,
    title: noun ? FRENCH[noun.name] : '',
    labels: strong.slice(0, 5).map((l) => l.name),
  };
}

module.exports = { suggestFromLabels, MIN_SCORE, CATEGORY_KEYWORDS };
