import { supabase } from "./supabaseClient.js";

const avatarImg = document.getElementById("user-avatar");
const avatarInput = document.getElementById("avatar-upload");

const usernameInput = document.getElementById("username");
const usernameText = document.getElementById("username-text");
const editUsernameBtn = document.getElementById("edit-username");

const dobInput = document.getElementById("dob");
const dobText = document.getElementById("dob-text");
const editDobBtn = document.getElementById("edit-dob");

const emailInput = document.getElementById("email");
const saveBtn = document.getElementById("save-profile");
const logoutBtn = document.getElementById("logout");

let currentUser;
let editingUsername = false;
let editingDob = false;

// ✅ Load profile on page load
document.addEventListener("DOMContentLoaded", async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
        // window.location.href = "login.html";
        return;
    }

    currentUser = data.user;
    emailInput.value = currentUser.email;

    // Load profile info
    const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

    if (error) {
        console.error("Error loading profile:", error.message);
    }

    if (profile) {
        usernameText.textContent = profile.username;
        usernameInput.value = profile.username;

        dobText.textContent = profile.dob || "Not set";
        dobInput.value = profile.dob || "";

        if (profile.avatar) avatarImg.src = profile.avatar;
    }
});

// ✅ Toggle username edit mode
editUsernameBtn.addEventListener("click", () => {
    editingUsername = !editingUsername;

    if (editingUsername) {
        usernameInput.style.display = "block";
        usernameText.style.display = "none";
        editUsernameBtn.innerHTML = `<i class="fas fa-times"></i>`;
    } else {
        usernameInput.style.display = "none";
        usernameText.style.display = "inline";
        editUsernameBtn.innerHTML = `<i class="fas fa-edit"></i>`;
    }
});

// ✅ Toggle DOB edit mode
editDobBtn.addEventListener("click", () => {
    editingDob = !editingDob;

    if (editingDob) {
        dobInput.style.display = "block";
        dobText.style.display = "none";
        editDobBtn.innerHTML = `<i class="fas fa-times"></i>`;
    } else {
        dobInput.style.display = "none";
        dobText.style.display = "inline";
        editDobBtn.innerHTML = `<i class="fas fa-edit"></i>`;
    }
});

// ✅ Upload avatar
avatarInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileName = `${currentUser.id}-${Date.now()}.${file.name.split(".").pop()}`;
    const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

    if (uploadError) {
        alert("Avatar upload failed: " + uploadError.message);
        return;
    }

    const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

    avatarImg.src = publicUrl;

    const { error } = await supabase
        .from("profiles")
        .update({ avatar: publicUrl })
        .eq("id", currentUser.id);

    if (error) {
        alert("Error updating avatar: " + error.message);
    } else {
        alert("Avatar updated!");
    }
});

// ✅ Save profile updates
saveBtn.addEventListener("click", async () => {
    const username = usernameInput.value.trim();
    let dob = dobInput.value.trim();

    if (!username) {
        alert("Username is required!");
        return;
    }

    // Convert empty DOB to null
    if (dob === "") dob = null;

    const { error } = await supabase
        .from("profiles")
        .update({ username, dob })
        .eq("id", currentUser.id);

    if (error) {
        alert("Error saving profile: " + error.message);
    } else {
        usernameText.textContent = username;
        dobText.textContent = dob || "Not set";

        // Reset view mode
        usernameInput.style.display = "none";
        usernameText.style.display = "inline";
        editUsernameBtn.textContent = "Edit";
        editingUsername = false;

        dobInput.style.display = "none";
        dobText.style.display = "inline";
        editDobBtn.textContent = "Edit";
        editingDob = false;

        alert("Profile updated successfully!");
    }
});


// ✅ Logout
logoutBtn.addEventListener("click", () => {
    showConfirm("You're about logging out, Proced?", logsOut)
});

async function logsOut() {
    await supabase.auth.signOut();
    window.location.href = "index.html";
}
