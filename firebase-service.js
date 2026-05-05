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
};
