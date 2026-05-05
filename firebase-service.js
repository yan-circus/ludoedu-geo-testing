// Requires Firebase compat SDK loaded via CDN in index.html

const firebaseConfig = {
  apiKey:            'AIzaSyDz1xCHbgqWsmhp1H5bia8smICmjBbi3uc',
  authDomain:        'ludoedu-fea1d.firebaseapp.com',
  projectId:         'ludoedu-fea1d',
  storageBucket:     'ludoedu-fea1d.firebasestorage.app',
  messagingSenderId: '595877165459',
  appId:             '1:595877165459:web:8e0fbd53344e3d7f899066',
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db   = firebase.firestore();

// Maps level select values → Firestore level IDs (must match seeded data)
const LEVEL_IDS = {
  monde: 1, Europe: 2, UE: 3, Afrique: 4, Asie: 5, Amérique: 6, Océanie: 7,
};

const GAME_TYPE_CHRONO = 1;  // "Classique" avec timer
const GAME_TYPE_LIBRE  = 2;  // "Sans chrono"
const DIFFICULTY       = 1;

let _currentUser = null;

auth.onAuthStateChanged(user => {
  _currentUser = user;
  if (typeof window.onFirebaseAuthChanged === 'function') {
    window.onFirebaseAuthChanged(user);
  }
});

window.firebaseService = {
  getUser: () => _currentUser,

  signUp: async (email, password, firstName, lastName) => {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    await cred.user.updateProfile({ displayName: firstName });
    await db.collection('users').doc(cred.user.uid).set({
      uuid:       cred.user.uid,
      first_name: firstName,
      last_name:  lastName,
      mail:       email,
      role_id:    'player',
      color:      0,
      skin_id:    1,
      date:       new Date().toISOString(),
      avatar:     '',
    });
    return cred.user;
  },

  signIn:  (email, password) => auth.signInWithEmailAndPassword(email, password),
  signOut: ()               => auth.signOut(),

  seedDatabase: async () => {
    const existing = await db.collection('games').doc('1').get();
    if (existing.exists) {
      console.log('Seed ignoré — données déjà présentes.');
      return;
    }

    const FAMILY_UUID = 'a1b2c3d4-0001-4000-8000-cliconmap0001';
    const now = new Date().toISOString();
    const batch = db.batch();

    // games
    batch.set(db.collection('games').doc('1'), {
      id:          1,
      name:        'Clic on Map',
      description: 'Jeu de géographie — trouvez les pays sur la carte du monde',
      version:     '1.0',
    });

    // game_types
    batch.set(db.collection('game_types').doc('1'), {
      id: 1, game_id: 1,
      name:  'Classique',
      notes: 'Avec chrono — répondez vite pour plus de points',
    });
    batch.set(db.collection('game_types').doc('2'), {
      id: 2, game_id: 1,
      name:  'Sans chrono',
      notes: 'Prenez votre temps, aucune pénalité de temps',
    });

    // level_families
    batch.set(db.collection('level_families').doc('1'), {
      id:      1,
      uuid:    FAMILY_UUID,
      game_id: 1,
      name:    'Carte du monde',
      notes:   'Planisphère SVG — tous les pays reconnus',
      date:    now,
      author:  'system',
    });

    // levels  (name = valeur du select dans le jeu)
    const LEVELS = [
      { id: 1, name: 'monde',    title: 'Monde entier',     notes: 'Tous les pays du monde' },
      { id: 2, name: 'Europe',   title: 'Europe',           notes: 'Pays du continent européen' },
      { id: 3, name: 'UE',       title: 'Union Européenne', notes: 'Les 27 membres de l\'UE' },
      { id: 4, name: 'Afrique',  title: 'Afrique',          notes: 'Pays du continent africain' },
      { id: 5, name: 'Asie',     title: 'Asie',             notes: 'Pays du continent asiatique' },
      { id: 6, name: 'Amérique', title: 'Amérique',         notes: 'Amérique du Nord et du Sud' },
      { id: 7, name: 'Océanie',  title: 'Océanie',          notes: 'Pays d\'Océanie' },
    ];

    LEVELS.forEach(lvl => {
      batch.set(db.collection('levels').doc(String(lvl.id)), {
        id:          lvl.id,
        uuid:        `b100000${lvl.id}-0001-4000-8000-cliconmap0001`,
        game_id:     1,
        family_id:   1,
        family_uuid: FAMILY_UUID,
        name:        lvl.name,
        title:       lvl.title,
        thumb:       '',
        author:      'system',
        nb_stars:    3,
        items:       [],
        is_lockable: false,
        date:        now,
        notes:       lvl.notes,
      });
    });

    // skins
    [
      { id: 1, name: 'Sombre',          notes: 'Thème sombre par défaut' },
      { id: 2, name: 'Coloré',          notes: 'Thème clair et coloré' },
      { id: 3, name: 'Carte au trésor', notes: 'Thème vintage' },
      { id: 4, name: 'Multicolore',     notes: 'Pays multicolores' },
    ].forEach(s => batch.set(db.collection('skins').doc(String(s.id)), s));

    await batch.commit();
    console.log('Seed OK — games, game_types, level_families, levels, skins créés dans Firestore.');
  },

  saveGame: async ({ levelKey, timerEnabled, score, timeMs, won, poolSize }) => {
    if (!_currentUser) return;
    const levelId    = LEVEL_IDS[levelKey] ?? 1;
    const gameTypeId = timerEnabled ? GAME_TYPE_CHRONO : GAME_TYPE_LIBRE;
    const maxScore   = poolSize * 1000;
    const ratio      = maxScore > 0 ? score / maxScore : 0;
    const stars      = !won ? 0 : ratio >= 0.7 ? 3 : ratio >= 0.4 ? 2 : 1;
    const now        = new Date().toISOString();
    const userId     = _currentUser.uid;

    await db.collection('save_games').add({
      date:            now,
      user_id:         userId,
      level_id:        levelId,
      game_type_id:    gameTypeId,
      difficulty:      DIFFICULTY,
      score,
      time_ms:         timeMs,
      is_completed:    won,
      items_collected: [],
      stars_collected: stars,
    });

    const progressId  = `${userId}_${levelId}_${gameTypeId}_${DIFFICULTY}`;
    const progressRef = db.collection('user_progress').doc(progressId);
    const existing    = await progressRef.get();
    if (!existing.exists || score > existing.data().score) {
      await progressRef.set({
        user_id:      userId,
        display_name: _currentUser.displayName || _currentUser.email.split('@')[0],
        level_id:     levelId,
        difficulty:   DIFFICULTY,
        game_type_id: gameTypeId,
        score,
        best_time:    timeMs,
        stars,
        completed:    won,
        date:         now,
      });
    }
  },

  getMyScores: async () => {
    if (!_currentUser) return [];
    const snap = await db.collection('user_progress')
      .where('user_id', '==', _currentUser.uid)
      .get();
    return snap.docs.map(d => d.data());
  },

  getUserSkin: async () => {
    if (!_currentUser) return null;
    const doc = await db.collection('users').doc(_currentUser.uid).get();
    return doc.exists ? (doc.data().skin_id || null) : null;
  },

  updateUserSkin: (skinId) => {
    if (!_currentUser) return Promise.resolve();
    return db.collection('users').doc(_currentUser.uid).update({ skin_id: skinId });
  },

  getLevelLeaderboard: async (levelId) => {
    const snap = await db.collection('user_progress')
      .where('level_id', '==', levelId)
      .get();
    const docs = snap.docs.map(d => d.data());
    docs.sort((a, b) => b.score - a.score);
    return docs.slice(0, 10);
  },
};
