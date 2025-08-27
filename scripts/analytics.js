// Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyCxm6rMdfPQXkrdTSST0BPS2WED9UL17w8",
    authDomain: "ohio-codespace.firebaseapp.com",
    projectId: "ohio-codespace",
    storageBucket: "ohio-codespace.firebasestorage.app",
    messagingSenderId: "122864528235",
    appId: "1:122864528235:web:408fbfaa1c8f4167abfa2e",
    measurementId: "G-VZYL32DRNQ"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);



