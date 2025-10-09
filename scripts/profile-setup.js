import { supabase } from "./supabaseClient.js";

const form = document.getElementById("profile-form");
const message = document.getElementById("message");
const avatarInput = document.getElementById("avatar");
const avatarPreview = document.getElementById("avatar-preview");

// Preview avatar image
avatarInput.addEventListener("change", () => {
    const file = avatarInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            avatarPreview.src = e.target.result;
            avatarPreview.style.display = "block";
        };
        reader.readAsDataURL(file);
    }
});

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    message.textContent = "";
    message.className = "message";

    const username = document.getElementById("username").value.trim();
    const dob = document.getElementById("dob").value;
    const avatarFile = avatarInput.files[0];

    if (!username) {
        message.textContent = "Username is required.";
        message.classList.add("error");
        return;
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        message.textContent = "Please log in first.";
        message.classList.add("error");
        return;
    }

    let avatarUrl = null;
    if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop();
        const filePath = `${user.id}/avatar.${fileExt}`;
        const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(filePath, avatarFile, { upsert: true });

        if (uploadError) {
            message.textContent = "Avatar upload failed.";
            message.classList.add("error");
            return;
        }

        const { data: publicURL } = supabase.storage
            .from("avatars")
            .getPublicUrl(filePath);

        avatarUrl = publicURL.publicUrl;
    }

    const { error } = await supabase
        .from("profiles")
        .upsert({
            id: user.id,
            username,
            dob: dob || null,
            avatar: avatarUrl || null,
            email: user.email,
        });

    if (error) {
        message.textContent = error.message;
        message.classList.add("error");
    } else {
        message.textContent = "Profile saved successfully! Redirecting...";
        message.classList.add("success");

        setTimeout(() => {
            window.location.href = "index.html";
        }, 1500);
    }
});