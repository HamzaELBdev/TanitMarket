# Brief de refonte UI/UX — TanitMarket

Prompt complet à coller dans Claude Design (ou tout outil de design) pour refaire l'UI/UX de TanitMarket.
La palette ci-dessous reflète les tokens réels du code (`tailwind.config.js`, `app/globals.css`).

> ℹ️ `DESIGN.md` à la racine décrit le langage visuel de Sentry (violet/Rubik) et **ne correspond pas** à l'app. Ce fichier-ci est la référence.

---

## 1. Le produit
TanitMarket est une marketplace de petites annonces entre particuliers en Tunisie, comme Leboncoin ou Vinted, mais locale.
- Promesse : « Les bonnes affaires. Juste à côté. » / « Simple. Local. Gratuit. »
- Publication d'annonces 100 % gratuite, sans commission.
- Fonction clé : la **négociation directe du prix** en Dinars Tunisiens (TND / DT), par offres et contre-offres dans une messagerie.
- Paiement à la livraison ou remise en main propre. Pas de paiement en ligne.
- Couverture des 24 gouvernorats (Tunis, Sousse, Sfax, Nabeul, Ariana, Bizerte, Monastir…).
- Trois langues : **Français, Arabe (RTL obligatoire), Anglais**. Un sélecteur de langue est présent dans le header.
- Application **mobile-first**, installable en PWA, avec notifications push. La majorité des utilisateurs sont sur smartphone.
- Trois rôles : visiteur, membre (compte « Particulier » ou « Boutique Pro ») et administrateur.

## 2. Système visuel (à respecter)

### Couleurs
| Rôle | Token | Hex |
|---|---|---|
| Primaire / CTA | `primary` | `#9FE870` |
| Survol | `primary-active` | `#CDFFAD` |
| Pressé | `primary-neutral` | `#C5EDAB` |
| Fond pâle | `primary-pale` | `#E2F6D5` |
| Fond | `canvas` | `#FFFFFF` |
| Surfaces / cartes | `canvas-soft` | `#E8EBE6` |
| Bordure / survol secondaire | — | `#DDE1D9` |
| Titres | `ink` | `#0E0F0C` |
| Texte sur lime | `ink-deep` | `#163300` |
| Texte courant | `body` | `#454745` |
| Texte secondaire | `mute` | `#868685` |
| Succès | `positive` / `positive-deep` | `#2EAD4B` / `#054D28` |
| Avertissement | `warning` / `warning-deep` / `warning-content` | `#FFD11A` / `#B86700` / `#4A3B1C` |
| Erreur | `negative` / `negative-deep` / `negative-darkest` / `negative-bg` | `#D03238` / `#A72027` / `#A7000D` / `#320707` |
| Accents illustration | `accent-orange` / `accent-cyan` | `#FFC091` / `#38C8FF` |
| Drapeau uniquement | — | `#E70013` |

- Une seule couleur d'accent : le lime. Onglet ou filtre actif : fond ink `#0E0F0C` avec texte lime `#9FE870`.

### Typographie, formes, style
- **Typographie** : Manrope 800–900 pour les titres (gros et compacts), Inter pour le texte et l'interface.
- **Formes** : arrondis de 8, 12, 16 et 24 px. Tous les boutons ont un arrondi de 24 px. Badges et pastilles en pill (9999 px).
- **Élévation** : design plat, sans ombres. Les niveaux se distinguent par le contraste entre le blanc et `#E8EBE6`.
- **Icônes** : Lucide (trait fin, arrondi).
- **Ton** : chaleureux, local, direct, avec quelques emojis bien placés.

## 3. Composants globaux
1. **Header desktop** : petite barre haute (« N°1 des annonces entre particuliers en Tunisie », « Marketplace 100 % Gratuite », sélecteur de langue). Puis logo avec le sous-titre « Les bonnes affaires en Tunisie », barre de recherche (sélecteur de catégorie + champ « Que cherchez-vous en Tunisie ? » + bouton Rechercher), sélecteur de gouvernorat, icônes Favoris, Messages et Notifications (menu déroulant avec « Tout marquer lu »), avatar ou « Connexion / Inscription », et un CTA lime « Déposer une annonce ». En dessous, des pastilles de catégories rapides.
2. **Barre de navigation mobile** (fixée en bas, compatible safe-area) : Accueil · Favoris · **Déposer** (bouton central en lime) · Messages · Profil. L'onglet Admin n'apparaît que pour les administrateurs.
3. **Footer** : slogan « Acheter. Vendre. Tout simplement. », colonnes Navigation / Compte & Sécurité / Couverture Tunisie, inscription à la newsletter, liens légaux (CGU, confidentialité, mentions légales) et « Fait pour la Tunisie » avec le drapeau.
4. **Carte produit** : photo, bouton favori (cœur), titre, prix en TND, badge « Prix négociable », état de l'article, localisation, ancienneté (« Il y a 2 h »), bouton « Discuter ». Prévoir aussi une version squelette pour le chargement.
5. **Modale de négociation** : prix demandé, champ « Votre prix proposé (TND) », slider de 50 % au prix fixe, remises rapides (-5 %, -10 %, -15 %), économie affichée (« Économie de 30 TND (-15 %) »), jauge de qualité de l'offre (Excellente en vert / Raisonnable en jaune / Agressive en rouge), message optionnel, bouton « Envoyer (130 TND) ». Mention : « Votre offre ouvre une discussion sans paiement préalable. »
6. **Aperçu rapide d'une annonce** (modale).
7. **Invite d'installation PWA** (version iOS avec instructions, version Android avec bouton) et **invite d'activation des notifications**.
8. Kit UI : Button (primaire, secondaire, tertiaire bordé, lime), Input, Select, Dropdown, Modal, Badge, StatusBadge (En attente / Approuvée / Refusée / Réservée), toasts, boîtes de confirmation.

## 4. Pages à concevoir
Pour chaque page, prévoir mobile (390 px) et desktop (1440 px), les états vide / chargement / erreur, et une variante arabe RTL pour au moins l'accueil et la fiche produit.

### 4.1 Accueil `/`
- Hero : badge « LA MARKETPLACE QUI NOUS RAPPROCHE », titre « Les bonnes affaires. / Juste à côté. », texte d'accroche, CTA « Je trouve mon bonheur », mention « 100 % près de vous · Annonces à Tunis, Sousse, Sfax… ». Visuel : photo de Sidi Bou Saïd, avec une carte d'annonce sponsorisée en surimpression.
- « Explorez par catégorie » : grille de cartes de catégories avec compteur d'annonces.
- « Fraîchement mis en ligne » : grille de cartes produit avec filtres (catégorie, gouvernorat) et état « Aucune annonce… Réinitialiser les filtres ».
- Bannière vendeur : « Ce qui dort chez vous peut faire un heureux. », CTA « Je dépose mon annonce ».
- Réassurance : paiement à la livraison, remise en main propre, 100 % gratuit.

### 4.2 Connexion / Inscription `/auth`
- Desktop en deux colonnes. À gauche, un panneau de marque (fond ink) : « Achetez et vendez sans aucun intermédiaire », 3 arguments (100 % gratuit et sans commission · Négociations directes · Tous les gouvernorats couverts), indicateur « Plateforme active en direct ».
- À droite, le formulaire avec deux onglets, Se connecter / Créer un compte :
  - Bouton « Continuer avec Google », séparateur « ou avec votre email ».
  - Inscription : nom complet, type de compte (Particulier / Boutique Pro), email, mot de passe (« Au moins 6 caractères »).
  - Connexion : email, mot de passe, lien « Mot de passe oublié ? ».
  - Mention CGU et confidentialité, lien « Retour à l'accueil ».
- État déjà connecté : « Vous êtes connecté en tant que… » avec les boutons Accéder à mon profil et Déconnexion.
- États d'erreur : champs manquants, mot de passe trop court, échec de connexion Google.

### 4.3 Fiche produit `/product/[id]`
- Galerie photos avec miniatures, bouton retour, numéro d'annonce, bouton partager (toast « Lien copié »), favori.
- Titre, prix en gros, badge négociable ou « Don gratuit 🎁 », état, localisation.
- **Caractéristiques dynamiques selon la catégorie** : marque, modèle, stockage, batterie (électronique) ; année, kilométrage, carburant, boîte, puissance fiscale (véhicule) ; type de bien, surface, chambres, meublé, ascenseur (immobilier) ; taille, genre (mode) ; race, vacciné (animaux)…
- Description.
- Carte vendeur : avatar, nom, badge « Vérifié », « Membre vérifié par SMS (+216) & E-mail », note, lien vers le profil public, bouton « Appeler ».
- CTA : « Négocier / Faire une offre » (primaire lime) et « Envoyer un message ». Sur mobile, une barre CTA collante en bas.
- « Annonces similaires recommandées ».
- États : chargement, introuvable, en attente de modération, réservée (négociation conclue).

### 4.4 Déposer une annonce `/create-listing` (wizard en 4 étapes)
- Barre de progression des étapes, avec transitions animées.
- **Étape 1, Catégorie** : 10 grandes cartes avec icône et description. Multimédia & High-Tech, Véhicules & Pièces Auto, Maison/Jardin/Déco, Mode & Accessoires, Immobilier, Sports/Loisirs/Vélos, Emploi/Services/Cours, Bébé/Enfants/Jouets, Animaux, Art/Collection/Antiquités.
- **Étape 2, Détails** : titre, état (Neuf scellé / Comme neuf / Bon état / État correct), description, puis des champs qui dépendent de la catégorie choisie.
- **Étape 3, Photos** : zone d'upload (glisser-déposer ou appareil photo sur mobile), grille d'aperçus, réorganisation, suppression.
- **Étape 4, Prix & mentions** : prix en TND, toggle « Autoriser la négociation », toggle don gratuit, gouvernorat et ville, téléphone (+216), options Paiement à la livraison / Remise en main propre / Sous garantie.
- Boutons Précédent / Suivant collés en bas sur mobile, au-dessus de la barre de navigation.
- Écran de succès : « Annonce publiée ! », avec la mention qu'elle passe en modération.

### 4.5 Messagerie & négociation `/chat`
- Desktop en deux panneaux : la liste des discussions (miniature produit, nom, dernier message, heure, non-lus) et la conversation.
- Sur mobile, la liste et la conversation sont deux écrans séparés.
- En-tête de conversation : produit concerné (photo, titre, prix) et interlocuteur.
- Bulles de messages, envoi d'image, horodatage (« À l'instant », « Il y a 5 min »).
- **Bulle d'offre spéciale** : « Offre de prix directe · 130 TND », avec les actions Accepter / Contre-offre / Refuser et les badges Acceptée / Refusée.
- Bandeau quand l'accord est conclu : « Négociation conclue à 130 TND. Cette annonce est désormais réservée. »
- Zone de saisie : champ texte, pièce jointe, bouton « Faire une offre ».
- États : non connecté (« Messagerie privée »), aucune discussion, aucune discussion sélectionnée.

### 4.6 Favoris `/favoris`
- En-tête avec compteur et valeur totale estimée, bouton « Tout vider » (avec confirmation).
- Recherche dans les favoris, pastilles de catégories, tri (Récents / Prix croissant / Prix décroissant).
- Grille de cartes produit.
- États : non connecté (« Gardez vos coups de cœur. »), vide (« Aucun coup de cœur… ❤️ »), aucun résultat pour les filtres, et suggestions « Ces annonces pourraient vous plaire ».

### 4.7 Mon profil `/profile` (espace membre)
- En-tête : avatar, nom, bio, badges de vérification (email, téléphone), statistiques (annonces actives, affaires conclues).
- Quatre onglets :
  1. **Mes annonces** : recherche par titre, filtre par statut (En attente / Approuvée / Refusée avec motif / Réservée), tri, cartes de gestion (Modifier, Supprimer, Marquer vendu). État vide : « Créer ma première annonce ».
  2. **Discussions** : liste résumée des conversations, avec un lien vers la messagerie.
  3. **Favoris** : aperçu.
  4. **Paramètres** : nom et bio ; vérification de l'email (envoi d'un code puis saisie du code) ; vérification du téléphone +216 par SMS (code à 6 chiffres) ; localisation (gouvernorat puis ville) ; déconnexion.

### 4.8 Profil public vendeur `/seller/[id]`
- Avatar, nom, « Membre depuis… », badges vérifiés, note moyenne en étoiles, nombre d'avis.
- Grille « Annonces de ce vendeur ».
- « Avis et évaluations » : liste des avis, formulaire « Laisser un avis » (sélection d'étoiles et texte, ou mise à jour de son avis). État non connecté : « Connectez-vous pour laisser un avis ».
- États : chargement, vendeur introuvable.

### 4.9 Dashboard administration `/dash` (administrateurs seulement, desktop en priorité)
- Titre « Tableau de bord administration » sur un bandeau ink avec texte lime.
- Onglets :
  1. **Vue d'ensemble** : KPI (annonces en attente, approuvées, utilisateurs actifs, total), « Dernières annonces soumises (temps réel) », « Activités en direct ».
  2. **Annonces** : tableau avec recherche et filtre de statut, actions Approuver / Refuser (modale avec motif) / Supprimer, bouton « Créer une annonce » (formulaire : titre, catégorie, prix, gouvernorat, statut initial, URL d'image, description).
  3. **Utilisateurs** : tableau (nom, email, rôle, statut Actif / Vérifié / Banni), actions Bannir / Réactiver.
  4. **Notifications** : journal des alertes.
- État « Accès restreint » pour les non-administrateurs.

### 4.10 Page 404
Illustration sympathique et bouton « Retourner à l'accueil ».

## 5. Exigences UX
- Mobile-first : zones tactiles de 44 px minimum, CTA principal à portée du pouce, safe-areas iOS respectées.
- Support RTL complet pour l'arabe : mise en page en miroir, icônes directionnelles inversées.
- Contraste AA. Ne jamais mettre du texte blanc sur le lime, toujours ink `#0E0F0C` ou `#163300`.
- Squelettes de chargement plutôt que des spinners.
- Animations discrètes (entrée en fondu et légère montée, 0,3 à 0,6 s), en respectant `prefers-reduced-motion`.
- Les prix sont toujours affichés en TND, en gros et en gras (ex. « 1 250 DT »).
- La négociation doit être visible partout : c'est ce qui différencie TanitMarket.

## 6. Livrables attendus
1. Une page « Design System » : couleurs, typographie, boutons, champs, badges, cartes, modales, navigation.
2. Chaque page de la section 4, en mobile et desktop.
3. Les flux clés en prototype : **(a)** inscription → dépôt d'une annonce ; **(b)** recherche → fiche produit → offre → chat → offre acceptée → annonce réservée ; **(c)** l'admin approuve une annonce.

---

## Annexe — couleurs codées en dur hors tokens
À rattacher aux tokens ou à intégrer à la palette lors de la refonte : `#788078`, `#FFEDE8`, `#AD4D39`, `#E70013`, `#FFF0DF`, `#F7F8F5`, `#313B35`, `#E6EAE3`, `#EDF8E7`, `#F4F6F2`.
