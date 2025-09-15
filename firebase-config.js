// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyB3MTQ1TAlv5XybVV2DZDI7v7sCzkVO8yw",
  authDomain: "pay-slip-generator-37980.firebaseapp.com",
  projectId: "pay-slip-generator-37980",
  messagingSenderId: "174710674762",
  appId: "1:174710674762:web:f8755cc8e51ed2ecb29db3",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Auth is always needed
const auth = firebase.auth();

// Firestore only if the SDK is loaded
let db = null;
if (firebase.firestore) {
  db = firebase.firestore();
}
