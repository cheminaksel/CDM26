'use strict';
/* ==================================================================
   PORTFOLIO macOS — config.js
   ------------------------------------------------------------------
   TOUT LE CONTENU DU SITE EST ICI. Remplace les textes d'exemple.
   Les fichiers (vidéos, captures, photos…) vont dans le dossier « assets ».

   Pour chaque projet :
   - video    : la vidéo montée, affichée dans le Viewer du logiciel.
                Fichier ('assets/videos/clip.mp4') ou lien YouTube / Vimeo.
   - timeline : la capture de ta VRAIE timeline (DaVinci Resolve / After Effects).
                Image ('assets/timelines/clip.png') ou capture vidéo
                ('assets/timelines/clip.mp4'). Une capture vidéo est lue en même
                temps que la vidéo du Viewer (pause, lecture, avance : tout est synchro).
   - timelineRange : (capture IMAGE seulement) où commence et où finit ton montage
                sur la capture, de 0 (bord gauche) à 1 (bord droit).
                Sert à placer la tête de lecture rouge au bon endroit. Ex. [0.12, 0.96]
   - app      : logiciel qui ouvre le projet : 'resolve', 'ae', 'ps' ou 'canva'
                (par défaut : vidéo → DaVinci, motion → After Effects,
                 photo → Photoshop, graphisme → Canva).
   - cover    : image de couverture. Sans image, une affiche colorée est générée.
   - gallery  : liste d'images (photos, ou pages d'un design).
   - before   : (photos) image AVANT retouche — visible quand on masque les calques
                de retouche dans Photoshop. Une image ou une liste (même ordre que gallery).
   ================================================================== */

const CONFIG = {
  name: 'Prénom Nom',
  initials: 'PN',
  role: 'Vidéaste & photographe',
  city: 'Ville, France',
  email: 'contact@exemple.fr',
  phone: '',             // ex. '06 12 34 56 78' (vide = masqué)
  status: 'Disponible pour des projets freelance',
  avatar: '',            // ex. 'assets/avatar.jpg' (sinon les initiales s'affichent)
  cv: '',                // ex. 'assets/cv.pdf'
  wallpaper: '',         // ex. 'assets/fond.jpg' (sinon fond dégradé)

  /* Formulaire de contact (page Contact + app Mail)
     - Laisse vide : le message s'ouvre tout prêt dans la messagerie du visiteur.
     - Pour recevoir les messages directement par e-mail, sans que le visiteur
       ouvre sa messagerie : crée un formulaire gratuit sur https://formspree.io
       et colle l'adresse ici, ex. 'https://formspree.io/f/abcdwxyz'            */
  formEndpoint: '',

  showreel: {
    title: 'Showreel 2026', duration: '1:30', video: '', cover: '',
    colors: ['#ff5e3a', '#6a3dff']
  },

  // network : instagram, youtube, vimeo, linkedin, tiktok ou behance (logo officiel)
  socials: [
    { network: 'instagram', handle: '@pseudo', url: 'https://instagram.com/' },
    { network: 'youtube', handle: 'Ma chaîne', url: 'https://youtube.com/' },
    { network: 'vimeo', handle: 'vimeo.com/pseudo', url: 'https://vimeo.com/' },
    { network: 'linkedin', handle: 'Prénom Nom', url: 'https://linkedin.com/' }
  ],

  bio: [
    "Vidéaste avant tout, photographe aussi. Je raconte des histoires en images : clips, aftermovies, films de marque, reportages.",
    "J'aime tout le processus, de l'écriture et du storyboard au tournage, jusqu'au montage et à l'étalonnage, où le film prend vraiment sa couleur.",
    "Basé en France, je me déplace pour les tournages et je suis ouvert aux collaborations, missions freelance et projets en équipe."
  ],

  /* PRÉSENTATION (menu « Présentation » en haut de l'écran)
     Les diapositives sont générées à partir de tout le contenu de ce fichier. */
  presentation: {
    hello: 'Bonjour, moi c\'est',
    pitch: 'Je raconte des histoires en images — de l\'idée au film fini.',
    services: [
      { icon: 'film', title: 'Vidéo', text: 'Clips, aftermovies, films de marque et reportages : écriture, tournage, montage.' },
      { icon: 'sparkle', title: 'Motion design', text: 'Titres animés, génériques, habillages et typographie cinétique.' },
      { icon: 'camera', title: 'Photo', text: 'Portrait, produit et photo de rue, retouche et étalonnage cohérent.' },
      { icon: 'pencil', title: 'Storyboard', text: 'Découpage technique et storyboards pour préparer chaque tournage.' }
    ],
    closing: 'Un projet, une idée, une envie de collaborer ? Écris-moi, je réponds vite.'
  },

  skills: [
    { label: 'Montage vidéo', value: 92 },
    { label: 'Étalonnage', value: 82 },
    { label: 'Photographie', value: 85 },
    { label: 'Motion design', value: 72 },
    { label: 'Storyboard & écriture', value: 78 },
    { label: 'Prise de son', value: 60 }
  ],

  // Les vrais logos s'affichent automatiquement pour ces logiciels
  tools: ['DaVinci Resolve', 'After Effects', 'Premiere Pro', 'Photoshop', 'Lightroom', 'Canva'],

  gear: [
    'Boîtier hybride plein format',
    'Objectifs 24-70 mm f/2.8 et 50 mm f/1.8',
    'Stabilisateur 3 axes',
    'Drone compact',
    'Micros-cravates sans fil',
    'Kit d\'éclairage LED'
  ],

  path: [
    { year: '2026', title: 'Vidéaste freelance', text: 'Clips, aftermovies et films de marque pour des artistes et des entreprises locales.' },
    { year: '2025', title: 'Stage en agence de communication', text: 'Tournage et montage de contenus pour les réseaux sociaux des clients.' },
    { year: '2023', title: 'Formation audiovisuel & multimédia', text: 'Écriture, tournage, montage, étalonnage, photographie et graphisme.' }
  ],

  /* STORYBOARDS (app Notes → dossier « Storyboards »)
     Mets tes images dans assets/storyboards/ puis :
     - frames : une case par plan → « image » = la case dessinée (ex. 'assets/storyboards/clip-01.jpg')
                Sans image, une esquisse au crayon est dessinée automatiquement.
     - pages  : (optionnel) planches entières scannées, affichées en grand
                ex. pages: ['assets/storyboards/clip-planche1.jpg', 'assets/storyboards/clip-planche2.jpg']
     project : (optionnel) id du projet lié, pour ouvrir la vidéo finale.        */
  storyboards: [
    {
      id: 'sb-clip', title: 'Clip musical — Artiste local', project: 'clip', date: '2025', pages: [],
      description: "Découpage écrit avec l'artiste avant le tournage de nuit. L'idée : une seule déambulation sous les néons, avec des ruptures de rythme sur les refrains.",
      frames: [
        { image: '', shot: 'Plan 1', framing: 'Plan large', move: 'Fixe', duration: '4 s', text: "La rue déserte, mouillée. Les néons se reflètent au sol." },
        { image: '', shot: 'Plan 2', framing: 'Plan moyen', move: 'Travelling avant', duration: '6 s', text: "L'artiste entre dans le champ et avance vers la caméra." },
        { image: '', shot: 'Plan 3', framing: 'Gros plan', move: 'Stabilisateur', duration: '3 s', text: "Visage éclairé en rouge, premier couplet en playback." },
        { image: '', shot: 'Plan 4', framing: 'Plan d\'ensemble', move: 'Drone, montée', duration: '5 s', text: "On s'élève au-dessus du carrefour sur le refrain." },
        { image: '', shot: 'Plan 5', framing: 'Insert', move: 'Fixe', duration: '2 s', text: "Main qui frappe le rythme sur une vitre embuée." },
        { image: '', shot: 'Plan 6', framing: 'Plan large', move: 'Travelling arrière', duration: '8 s', text: "L'artiste s'éloigne, les néons s'éteignent un par un." }
      ]
    },
    {
      id: 'sb-court', title: 'Court-métrage — « La dernière prise »', project: 'court-metrage', date: '2026', pages: [],
      description: "Storyboard de la séquence d'ouverture, préparé pour le plan de tournage et partagé avec l'équipe image.",
      frames: [
        { image: '', shot: 'Plan 1', framing: 'Plan large', move: 'Panoramique', duration: '5 s', text: "Le plateau vide, une seule lumière allumée." },
        { image: '', shot: 'Plan 2', framing: 'Plan rapproché', move: 'Fixe', duration: '4 s', text: "La réalisatrice relit ses notes, hésite." },
        { image: '', shot: 'Plan 3', framing: 'Contrechamp', move: 'Épaule', duration: '3 s', text: "Le comédien attend, face caméra." },
        { image: '', shot: 'Plan 4', framing: 'Très gros plan', move: 'Fixe', duration: '2 s', text: "Le clap : « Dernière prise »." }
      ]
    }
  ],

  projects: [
    { id: 'aftermovie', title: 'Aftermovie — Festival d\'été', short: 'Aftermovie', category: 'pro', type: 'video',
      client: 'Festival (exemple)', year: '2026', role: 'Captation, montage, étalonnage', duration: '2:48',
      description: "Trois jours de tournage en immersion pour raconter l'énergie du festival : scènes, public, coulisses. Montage rythmé calé sur la musique et étalonnage chaud pour garder l'ambiance des fins de journée.",
      tags: ['Événementiel', 'Aftermovie', '4K'], tools: ['DaVinci Resolve', 'After Effects'], fav: true,
      video: '', timeline: '', cover: '', colors: ['#ff7a3d', '#c2185b'] },

    { id: 'clip', title: 'Clip musical — Artiste local', short: 'Clip', category: 'pro', type: 'video',
      client: 'Artiste (exemple)', year: '2025', role: 'Réalisation, cadrage, montage', duration: '3:32',
      description: "Clip tourné en une nuit dans les rues de la ville, éclairé presque uniquement aux néons. Découpage écrit avec l'artiste, tournage au stabilisateur et montage au rythme du morceau.",
      tags: ['Clip', 'Musique', 'Nuit'], tools: ['DaVinci Resolve'], fav: true,
      video: '', timeline: '', cover: '', colors: ['#7b2ff7', '#00d4ff'] },

    { id: 'film-marque', title: 'Film de marque — Restaurant', short: 'Film de marque', category: 'pro', type: 'video',
      client: 'Restaurant (exemple)', year: '2025', role: 'Tournage, montage, sound design', duration: '1:15',
      description: "Un format court pour les réseaux sociaux : la cuisine, les produits et l'équipe. Plans macro, lumière naturelle et déclinaisons verticales 9:16 pour Instagram.",
      tags: ['Publicité', 'Food', 'Réseaux sociaux'], tools: ['DaVinci Resolve', 'Canva'],
      video: '', timeline: '', cover: '', colors: ['#f7b733', '#fc4a1a'] },

    { id: 'teaser', title: 'Teaser de lancement — Application', short: 'Teaser', category: 'pro', type: 'motion',
      client: 'Start-up (exemple)', year: '2026', role: 'Motion design, typographie animée', duration: '0:45',
      description: "Animation de 45 secondes pour annoncer le lancement d'une application : typographie cinétique, transitions fluides et mise en avant des fonctionnalités clés.",
      tags: ['Motion design', 'Typographie', 'Lancement'], tools: ['After Effects'],
      video: '', timeline: '', cover: '', colors: ['#00c6ff', '#0050d0'] },

    { id: 'sneakers', title: 'Shooting produit — Sneakers', short: 'Sneakers', category: 'pro', type: 'photo',
      client: 'Boutique (exemple)', year: '2025', role: 'Photographie, retouche', duration: '24 photos',
      description: "Série de photos produit en studio pour une boutique en ligne : fond coloré, lumière dure, détails matière. Retouche et harmonisation des couleurs sur toute la série.",
      tags: ['Produit', 'Studio', 'E-commerce'], tools: ['Photoshop', 'Lightroom'],
      cover: '', gallery: [], before: '', colors: ['#ff5f6d', '#ffc371'] },

    { id: 'miniatures', title: 'Miniatures YouTube', short: 'Miniatures', category: 'pro', type: 'design', format: 'miniature',
      client: 'Créateur de contenu (exemple)', year: '2026', role: 'Graphisme', duration: '20 visuels',
      description: "Création d'une ligne graphique de miniatures pour une chaîne YouTube : typographie forte, détourages et couleurs saturées pour ressortir dans le fil.",
      tags: ['YouTube', 'Miniatures'], tools: ['Canva', 'Photoshop'],
      cover: '', gallery: [], colors: ['#f12711', '#f5af19'] },

    { id: 'kit-reseaux', title: 'Kit réseaux sociaux', short: 'Posts', category: 'pro', type: 'design', format: 'post',
      client: 'Restaurant (exemple)', year: '2025', role: 'Graphisme, déclinaisons', duration: '12 visuels',
      description: "Gabarits de posts et de stories pour accompagner le film de marque : menus, annonces d'événements et visuels saisonniers.",
      tags: ['Instagram', 'Gabarits'], tools: ['Canva'],
      cover: '', gallery: [], colors: ['#ee0979', '#ff6a00'] },

    { id: 'court-metrage', title: 'Court-métrage — « La dernière prise »', short: 'Court-métrage', category: 'scolaire', type: 'video',
      client: 'Projet de fin d\'année', year: '2026', role: 'Réalisation, montage', duration: '8:20',
      description: "Court-métrage de fiction écrit et tourné en équipe de cinq. Gestion du plan de tournage, réalisation sur deux jours puis montage, mixage et étalonnage.",
      tags: ['Fiction', 'Court-métrage', 'Équipe'], tools: ['DaVinci Resolve'], fav: true,
      video: '', timeline: '', cover: '', colors: ['#2c3e50', '#c94b4b'] },

    { id: 'reportage', title: 'Reportage — Portes ouvertes', short: 'Reportage', category: 'scolaire', type: 'video',
      client: 'Établissement (exemple)', year: '2025', role: 'Interviews, tournage, montage', duration: '4:05',
      description: "Reportage pour présenter la formation aux futurs étudiants : interviews, plans d'illustration et habillage graphique aux couleurs de l'école.",
      tags: ['Reportage', 'Interview'], tools: ['DaVinci Resolve', 'After Effects'],
      video: '', timeline: '', cover: '', colors: ['#11998e', '#38ef7d'] },

    { id: 'generique', title: 'Générique animé — Festival étudiant', short: 'Générique', category: 'scolaire', type: 'motion',
      client: 'Projet de cours', year: '2025', role: 'Motion design', duration: '0:30',
      description: "Générique d'ouverture en motion design : formes géométriques, rythme calé sur la musique et révélation du titre.",
      tags: ['Motion design', 'Générique'], tools: ['After Effects', 'Illustrator'],
      video: '', timeline: '', cover: '', colors: ['#8e2de2', '#ff3d9a'] },

    { id: 'portraits', title: 'Série portraits — Studio', short: 'Portraits', category: 'scolaire', type: 'photo',
      client: 'Projet de cours', year: '2025', role: 'Photographie, éclairage, retouche', duration: '12 photos',
      description: "Série de portraits en studio autour de l'éclairage : Rembrandt, papillon, contre-jour. Retouche de peau et étalonnage cohérent sur toute la série.",
      tags: ['Portrait', 'Studio', 'Lumière'], tools: ['Photoshop', 'Lightroom'], fav: true,
      cover: '', gallery: [], before: '', colors: ['#3a1c71', '#ffaf7b'] },

    { id: 'carnet-urbain', title: 'Photo de rue — Carnet urbain', short: 'Carnet urbain', category: 'scolaire', type: 'photo',
      client: 'Projet personnel', year: '2024', role: 'Photographie', duration: '30 photos',
      description: "Une année de photo de rue : lignes, reflets et silhouettes. Sélection et développement en noir et blanc et en couleurs douces.",
      tags: ['Street', 'Urbain'], tools: ['Lightroom'],
      cover: '', gallery: [], before: '', colors: ['#1f4037', '#99f2c8'] },

    { id: 'affiche', title: 'Affiche — Soirée courts-métrages', short: 'Affiche', category: 'scolaire', type: 'design', format: 'affiche',
      client: 'Association étudiante', year: '2025', role: 'Graphisme', duration: 'A3',
      description: "Affiche pour une soirée de projection de courts-métrages étudiants, déclinée en version réseaux sociaux.",
      tags: ['Affiche', 'Événement'], tools: ['Photoshop', 'Canva'],
      cover: '', gallery: [], colors: ['#141e30', '#e94057'] }
  ]
};
