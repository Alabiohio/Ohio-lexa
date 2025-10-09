import { supabase } from "./supabaseClient.js";
const errorMsg = document.getElementById("error-message");
const successMsg = document.getElementById("success-message");
const signupBtn = document.querySelector(".signupBtn");


document.getElementById("signup-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  signupBtn.innerHTML = ` <l-ring size="30" stroke="5" bg-opacity="0" speed="2" color="white"></l-ring>
`;
  signupBtn.disabled = true;
  googleSignInBtn.disabled = true;


  errorMsg.style.display = "none";
  successMsg.style.display = "none";

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    alert("❌ Signup failed: " + error.message);
    errorMsg.textContent = error.message;
    errorMsg.style.display = "block";
    signupBtn.innerHTML = `Sign Up`;
    signupBtn.disabled = false;
    googleSignInBtn.disabled = false;
  } else {
    successMsg.textContent = "Login successful! Redirecting...";
    successMsg.style.display = "block";
    alert(
      "✅ Signup successful! Please check your email to confirm your account."
    );
    console.log(data);
    // Redirect to login
    window.location.href = "login.html";
  }
});

const googleSignInBtn = document.getElementById("google-login-btn");

googleSignInBtn.addEventListener("click", async () => {

  googleSignInBtn.innerHTML = `<l-ring size="40" stroke="5" bg-opacity="0" speed="2" color="green"></l-ring>
`;
  googleSignInBtn.disabled = true;
  signupBtn.disabled = true;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin, // where user lands after login
    },
  });

  if (error) {
    console.error("Google login error:", error.message);
    signupBtn.disabled = false;
    googleSignInBtn.disabled = false;
  } else {
    signupBtn.disabled = false;
    googleSignInBtn.disabled = false;
    console.log("Redirecting to Google...");
  }
});

// Check for logged-in user after redirect
document.addEventListener("DOMContentLoaded", async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.user) {
    currentUser = session.user;
    console.log("Logged in as:", currentUser.email);
    loadChatHistory();
  }
});
