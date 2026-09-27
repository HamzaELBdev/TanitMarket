# Vidéo de présentation TanitMarket (Remotion)

Vidéo promo de 54 s en deux formats, avec musique originale et effets sonores :

- `out/TanitMarket-16x9.mp4` : 1920×1080 (YouTube, site, présentation)
- `out/TanitMarket-9x16.mp4` : 1080×1920 (TikTok, Reels, Stories)

## Scènes
Intro (le logo se dessine) → souk « Achetez. Vendez. Tout simplement. » → annonces (prix animés, clic sur ♥)
→ négociation dans le chat (offre, contre-offre, confettis) → 24 gouvernorats → Simple. Local. Gratuit.
(titre en FR, AR puis EN) → appel à l'action.

Les timings sont dans `src/timeline.json`. Chaque changement de scène tombe sur une mesure de la musique
(120 BPM, 1 mesure = 2 s = 60 images).

## Musique
`audio/compose.py` synthétise tout, sans aucun sample : oud (corde pincée Karplus-Strong), darbouka
en rythme maqsum, basse et nappes en mode hijaz sur ré (D – Gm – Cm – D). La musique est donc
originale et libre de droits. Elle génère aussi les bruitages (whoosh, pop, clic, ding) dans `public/audio/`.

```bash
pip install numpy
npm run music
```

## Prévisualiser / exporter
```bash
npm install
npm run studio   # timeline dans le navigateur, image par image
npm run render   # génère les deux MP4 dans out/
```
Pour utiliser un Chromium déjà installé : `REMOTION_BROWSER=/chemin/vers/chrome npm run render`.

Licence Remotion : gratuite pour les particuliers et les entreprises de 3 personnes maximum,
sinon il faut une licence entreprise (voir remotion.dev/license).
