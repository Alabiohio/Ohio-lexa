import { supabase } from "./supabaseClient.js";

const logoutbtn = document.getElementById("logout-btn");

// Check if user is logged in
async function checkUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Not logged in → redirect
    // window.location.href = "login.html";
    logoutbtn.style.display = "none";
  } else {
    // document.getElementById("welcome").textContent = `Welcome, ${user.email}`;
    logoutbtn.style.display = "block";
  }
}

checkUser();

// Logout button

logoutbtn.addEventListener("click", () => {
  showConfirm("You are about to log out, proceed?", loggingOut);
});

async function loggingOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    alert("❌ Logout failed: " + error.message);
  } else {
    window.location.href = "login.html";
  }
}
