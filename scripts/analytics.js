// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-analytics.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCXQChjO4D3b6G_ZPcIciY9DgcFlExxMdA",
  authDomain: "ohio-lexa.firebaseapp.com",
  projectId: "ohio-lexa",
  storageBucket: "ohio-lexa.firebasestorage.app",
  messagingSenderId: "408627675447",
  appId: "1:408627675447:web:3b571eec0e89b73a98dab2",
  measurementId: "G-8850TSCVB6",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
