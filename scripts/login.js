import { supabase } from "./supabaseClient.js";

const errorMsg = document.getElementById("error-message");
const successMsg = document.getElementById("success-message");
const loginBtn = document.querySelector(".loginBtn");
const googleSignInBtn = document.getElementById("google-login-btn");

// ✅ Email/password login
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  loginBtn.innerHTML = `<l-ring size="30" stroke="5" bg-opacity="0" speed="2" color="white"></l-ring>`;
  loginBtn.disabled = true;

  errorMsg.style.display = "none";
  successMsg.style.display = "none";

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    errorMsg.textContent = error.message;
    errorMsg.style.display = "block";
    loginBtn.innerHTML = `Login`;
    loginBtn.disabled = false;
  } else {
    successMsg.textContent = "Login successful! Redirecting...";
    successMsg.style.display = "block";
    console.log("User:", data.user);
    await handleProfileAndRedirect(data.user);
  }
});

// ✅ Google Sign-In
googleSignInBtn.addEventListener("click", async () => {
  googleSignInBtn.innerHTML = `<l-ring size="40" stroke="5" bg-opacity="0" speed="2" color="green"></l-ring>`;
  googleSignInBtn.disabled = true;
  loginBtn.disabled = true;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/login.html`, // works fine on Vercel
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    console.error("Google login error:", error.message);
    alert("Google login failed!");
  } else {
    console.log("Redirecting to Google...");
  }
});

// ✅ Check after redirect (for Google OAuth)
document.addEventListener("DOMContentLoaded", async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user;
  if (user) {
    console.log("Logged in as:", user.email);
    await handleProfileAndRedirect(user);
  }
});

// ✅ Helper: Handle profile creation + redirect
async function handleProfileAndRedirect(user) {
  try {
    // Try fetching profile
    let { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // If profile doesn't exist, create one
    if (fetchError || !profile) {
      console.warn("Profile not found, creating new one...");
      const meta = user.user_metadata || {};

      const newProfile = {
        id: user.id,
        email: user.email,
        username: meta.full_name || meta.name || "User",
        avatar: meta.avatar_url || null,
      };

      const { error: insertError } = await supabase.from("profiles").insert([newProfile]);
      if (insertError) {
        console.error("Profile insert error:", insertError.message);
      } else {
        console.log("✅ Profile created:", newProfile);
        window.location.href = "index.html";
      }

      profile = newProfile; // set for redirect logic
    }

    // Redirect logic
    if (!profile.username || profile.username === "User") {
      window.location.href = "profile-setup.html";
    } else {
      // window.location.href = "index.html";
    }
  } catch (err) {
    console.error("Unexpected error:", err);
    alert("Something went wrong. Try again.");
  }
}
