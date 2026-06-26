// syncdrive-frontend/src/services/firebase.js
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCOn7KoXagNl6H46HqrcVMO5lMvdp8TPw4",
  authDomain: "distributed-cloud-8b67d.firebaseapp.com",
  projectId: "distributed-cloud-8b67d",
  storageBucket: "distributed-cloud-8b67d.firebasestorage.app",
  messagingSenderId: "943273499297",
  appId: "1:943273499297:web:61566dec57aa3863a0eee0",
  measurementId: "G-4HEY1JLXHP"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithPopup
};