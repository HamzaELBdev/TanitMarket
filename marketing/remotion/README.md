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

## Voix off (dialecte tunisien)
- Enregistrements d'origine : `audio/voice-src/NN.mp3` (un fichier par scène, `01` = intro … `07` = fin).
- Versions normalisées utilisées par la vidéo (-16 LUFS, filtre passe-haut, légère compression) : `public/audio/voice/NN.wav`.
- `src/voice.json` liste les répliques présentes, la scène où chacune démarre et sa durée. La musique baisse automatiquement sous la voix.
- Pour ajouter une réplique (par ex. `01`) : déposer le MP3 dans `audio/voice-src/`, le normaliser avec
  `ffmpeg -i audio/voice-src/01.mp3 -af "highpass=f=80,acompressor=threshold=-20dB:ratio=2.5:attack=5:release=120,loudnorm=I=-16:TP=-1.5:LRA=7" -ar 48000 -ac 1 public/audio/voice/01.wav`,
  puis l'ajouter dans `src/voice.json` (scène `intro`, `souk`, …, et `durationInFrames` = durée × 30).
- Rendus avec voix : `out/TanitMarket-16x9-voix.mp4` et `out/TanitMarket-9x16-voix.mp4`.

## Vidéo « Tirage au sort »
Vidéo de 23 s pour pousser à la création de compte : 100 DT à gagner, tirage en fin de mois.
- Compositions `TirageVertical` (1080×1920, Reels/Stories/TikTok) et `Tirage` (1920×1080).
- Montant, mois, date du tirage, URL, mention légale et phrase en arabe : `src/giveaway/config.json`.
  Pour le mois suivant, il suffit de changer `month`, `drawDay`, `drawMonthShort` et `drawLabel`, puis de refaire le rendu :
  `npx remotion render TirageVertical out/TanitMarket-Tirage-9x16.mp4` et `npx remotion render Tirage out/TanitMarket-Tirage-16x9.mp4`.

## Prévisualiser / exporter
```bash
npm install
npm run studio   # timeline dans le navigateur, image par image
npm run render   # génère les deux MP4 dans out/
```
Pour utiliser un Chromium déjà installé : `REMOTION_BROWSER=/chemin/vers/chrome npm run render`.

Licence Remotion : gratuite pour les particuliers et les entreprises de 3 personnes maximum,
sinon il faut une licence entreprise (voir remotion.dev/license).
