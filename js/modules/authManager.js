// Authentication manager
import { initializeFirebase } from '../config/firebase.js';
import { AUTH_ERROR_MESSAGES, COLLECTIONS } from '../config/constants.js';
import { appState } from './appState.js';
import { NotificationManager } from '../utils/notifications.js';
import { Helpers } from '../utils/helpers.js';

export class AuthManager {
  constructor() {
    this.auth = null;
    this.db = null;
    this.initialize();
  }

  initialize() {
    try {
      const firebase = initializeFirebase();
      this.auth = firebase.auth;
      this.db = firebase.db;
      this.setupAuthStateListener();
    } catch (error) {
      console.error('Error initializing Firebase:', error);
      NotificationManager.showError('Error al inicializar Firebase');
    }
  }

  setupAuthStateListener() {
    if (!this.auth) return;

    this.auth.onAuthStateChanged(async user => {
      if (user) {
        await this.handleUserLogin(user);
      } else {
        this.handleUserLogout();
      }
    });
  }

  async handleUserLogin(user) {
    try {
      appState.setLoading(false);

      const userDoc = await this.db
        .collection(COLLECTIONS.USERS)
        .doc(user.uid)
        .get();
      let userData = {};

      if (userDoc.exists) {
        userData = userDoc.data();
      }

      // Create a complete user object with both Firebase Auth and Firestore data
      const completeUser = {
        ...user,
        ...userData,
        uid: user.uid, // Ensure UID is always present
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      };

      console.log('🔄 Saving complete user to AppState:', completeUser.uid);
      appState.setCurrentUser(completeUser);

      NotificationManager.showSuccess('Sesión iniciada exitosamente');

      // Emit custom event for other modules to listen
      this.emitAuthEvent('login', completeUser, userData);
    } catch (error) {
      console.error('Error loading user data:', error);
      NotificationManager.showError('Error al cargar los datos del usuario');
    }
  }

  handleUserLogout() {
    appState.clearCurrentUser();
    appState.reset();

    NotificationManager.showSuccess('Sesión cerrada exitosamente');

    // Emit custom event for other modules to listen
    this.emitAuthEvent('logout');
  }

  async registerUser(email, password, username) {
    try {
      const userCredential = await this.auth.createUserWithEmailAndPassword(
        email,
        password
      );
      const userId = userCredential.user.uid;

      await this.db.collection(COLLECTIONS.USERS).doc(userId).set({
        username,
        email,
        createdAt: new Date(),
      });

      NotificationManager.showSuccess('Usuario registrado exitosamente');
      return userCredential.user;
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    }
  }

  async loginUser(identifier, password) {
    try {
      if (identifier.includes('@')) {
        // Login with email
        await this.auth.signInWithEmailAndPassword(identifier, password);
      } else {
        // Login with username
        const userQuery = await this.db
          .collection(COLLECTIONS.USERS)
          .where('username', '==', identifier)
          .get();

        if (userQuery.empty) {
          throw new Error('El usuario no existe. Por favor, regístrate.');
        }

        const userDoc = userQuery.docs[0];
        const userEmail = userDoc.data().email;
        await this.auth.signInWithEmailAndPassword(userEmail, password);
      }

      NotificationManager.showSuccess('Sesión iniciada exitosamente');
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    }
  }

  async googleAuth() {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      await this.auth.signInWithPopup(provider);
      NotificationManager.showSuccess('Sesión iniciada con Google');
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    }
  }

  async logout() {
    try {
      await this.auth.signOut();
      NotificationManager.showSuccess('Sesión cerrada exitosamente');
    } catch (error) {
      NotificationManager.showError('Error al cerrar sesión');
      throw error;
    }
  }

  handleAuthError(error) {
    let errorMessage = AUTH_ERROR_MESSAGES.default;

    if (error.code && AUTH_ERROR_MESSAGES[error.code]) {
      errorMessage = AUTH_ERROR_MESSAGES[error.code];
    } else if (error.message) {
      errorMessage = error.message;
    }

    NotificationManager.showError(errorMessage);
  }

  // Validation methods
  validateAuthData(authData) {
    const errors = [];

    if (!Helpers.isRequired(authData.identifier)) {
      errors.push('El email o usuario es requerido');
    }

    if (!Helpers.isRequired(authData.password)) {
      errors.push('La contraseña es requerida');
    }

    if (appState.isRegistering()) {
      if (!Helpers.isRequired(authData.username)) {
        errors.push('El nombre de usuario es requerido');
      }

      if (!Helpers.isValidEmail(authData.identifier)) {
        errors.push('El email no tiene un formato válido');
      }
    }

    return errors;
  }

  // User profile methods
  async updateUserProfile(userId, profileData) {
    try {
      await this.db
        .collection(COLLECTIONS.USERS)
        .doc(userId)
        .set(profileData, { merge: true });

      // Update current user in state
      const currentUser = appState.getCurrentUser();
      if (currentUser && currentUser.uid === userId) {
        appState.setCurrentUser({ ...currentUser, ...profileData });
      }

      NotificationManager.showSuccess('Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error updating user profile:', error);
      NotificationManager.showError('Error al actualizar el perfil');
      throw error;
    }
  }

  async getUserProfile(userId) {
    try {
      const userDoc = await this.db
        .collection(COLLECTIONS.USERS)
        .doc(userId)
        .get();
      return userDoc.exists ? userDoc.data() : null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  // Password reset
  async resetPassword(email) {
    try {
      await this.auth.sendPasswordResetEmail(email);
      NotificationManager.showSuccess('Email de recuperación enviado');
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    }
  }

  // Email verification
  async sendEmailVerification() {
    try {
      const user = this.auth.currentUser;
      if (user && !user.emailVerified) {
        await user.sendEmailVerification();
        NotificationManager.showSuccess('Email de verificación enviado');
      }
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!appState.getCurrentUser();
  }

  // Get Firebase instance
  getFirebase() {
    return {
      auth: this.auth,
      db: this.db,
    };
  }

  // Get current user
  getCurrentUser() {
    let currentUser = appState.getCurrentUser();
    if (!currentUser && this.auth) {
      const firebaseUser = this.auth.currentUser;
      if (firebaseUser) {
        console.log('🔄 Getting user from Firebase Auth:', firebaseUser.uid);
        appState.setCurrentUser(firebaseUser);
        currentUser = firebaseUser;
      }
    }
    return currentUser;
  }

  // Get user display name
  getUserDisplayName(user = null) {
    const currentUser = user || this.getCurrentUser();
    if (!currentUser) return '';

    if (currentUser.name && currentUser.lastName) {
      return `${currentUser.name} ${currentUser.lastName}`;
    }

    return currentUser.username || currentUser.email || 'Usuario';
  }

  // Get user avatar
  getUserAvatar(user = null) {
    const currentUser = user || this.getCurrentUser();
    if (!currentUser) return 'https://via.placeholder.com/32';

    return (
      currentUser.avatarBase64 ||
      currentUser.photoURL ||
      'https://via.placeholder.com/32'
    );
  }

  // Custom event emitter for auth events
  emitAuthEvent(type, user = null, userData = null) {
    const event = new CustomEvent('authStateChanged', {
      detail: { type, user, userData },
    });
    document.dispatchEvent(event);
  }

  // Listen to auth events
  onAuthStateChanged(callback) {
    document.addEventListener('authStateChanged', event => {
      callback(event.detail);
    });
  }

  // Remove auth event listener
  removeAuthStateListener(callback) {
    document.removeEventListener('authStateChanged', callback);
  }
}

// Create singleton instance
export const authManager = new AuthManager();
