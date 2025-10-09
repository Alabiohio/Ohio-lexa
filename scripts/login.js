import { supabase } from "./supabaseClient.js";

const errorMsg = document.getElementById("error-message");
const successMsg = document.getElementById("success-message");
const loginBtn = document.querySelector(".loginBtn");

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  loginBtn.innerHTML = ` <l-ring size="30" stroke="5" bg-opacity="0" speed="2" color="white"></l-ring>
`;
  loginBtn.disabled = true;

  errorMsg.style.display = "none";
  successMsg.style.display = "none";

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    errorMsg.textContent = error.message;
    errorMsg.style.display = "block";
    loginBtn.innerHTML = `Login`;
    loginBtn.disabled = false;

  } else {
    successMsg.textContent = "Login successful! Redirecting...";
    successMsg.style.display = "block";
    console.log("User:", data.user);

    // ✅ Check if user has a username in the profiles table
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", data.user.id)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError.message);
      alert("Error loading profile. Try again.");
      return;
    }

    setTimeout(() => {
      if (!profile || !profile.username) {
        // ❌ No username yet → go to setup page
        window.location.href = "profile-setup.html";
      } else {
        // ✅ Username exists → go to chat page
        window.location.href = "index.html";
      }
    }, 1500);
  }
});

// ✅ Redirect if already logged in
document.addEventListener("DOMContentLoaded", async () => {
  const { data } = await supabase.auth.getUser();
  if (data.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", data.user.id)
      .single();

    if (!profile || !profile.username) {
      window.location.href = "profile-setup.html";
    } else {
      window.location.href = "index.html";
    }
  }
});


const googleSignInBtn = document.getElementById("google-login-btn");

googleSignInBtn.addEventListener("click", async () => {
  googleSignInBtn.innerHTML = `<l-ring size="40" stroke="5" bg-opacity="0" speed="2" color="green"></l-ring>
`;
  googleSignInBtn.disabled = true;
  loginBtn.disabled = true;

  googleSignInBtn.innerHTML = `<l-ring size="40" stroke="5" bg-opacity="0" speed="2" color="green"></l-ring>
`;
  googleSignInBtn.disabled = true;
  loginBtn.disabled = true;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin, // where user lands after login
    },
  });

  if (error) {
    console.error("Google login error:", error.message);
  } else {
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

document.addEventListener("DOMContentLoaded", async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.user) {
    currentUser = session.user;
    await loadChatHistory();
    showUserProfile(currentUser);
  }
});
