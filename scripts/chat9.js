// CAMERA FIX AND NOTIFY DIALOGUE
const API_KEY = "AIzaSyDWnyPqVNNhHd7Q2HElWqhUiUuShs0hwDs";
const model = "gemini-2.0-flash";
const API_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=` +
  API_KEY;
const introBox = document.querySelector(".introBox");
const inputBox = document.getElementById("userInputBox");
const recordSpan = document.getElementById("rcdSpan");
const openOptsBtn = document.getElementById("openMedOpts");
const optMenu = document.querySelector(".optDiv");
const galleryInput = document.getElementById("galleryInput");
const cameraInput = document.getElementById("cameraInput");
const uploadImgBtn = document.getElementById("uploadImgBtn");
const captureImgBtn = document.getElementById("captureImgBtn");
const clearBtn = document.getElementById("clrBtn");
const homeSigninBtn = document.getElementById("homeSigninBtn");
const sendMessageBtn = document.getElementById("sendMessageBtn");
const inputField = document.getElementById("userInput");
sendMessageBtn.disabled = true;

const supabase = window.supabase.createClient(
  "https://znqzjwlygjvqxmtfkdmg.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpucXpqd2x5Z2p2cXhtdGZrZG1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NzIzMzcsImV4cCI6MjA3MjI0ODMzN30.OMIMMBgl_1j6EIdvhfoCnlPP9VQF0c81lE0mcNnAgZE"
);

let currentUser = null;

let pendingImage = null;
let pendingPreview = null;
let conversationHistory = [];
const MAX_HISTORY = 20; // keep last 20 messages (10 user+bot exchanges)

document.addEventListener("DOMContentLoaded", async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    currentUser = user;
  }
  await loadChatHistory(); // load from Supabase if logged in, else from sessionStorage
});

function trimHistory() {
  if (conversationHistory.length > MAX_HISTORY) {
    conversationHistory = conversationHistory.slice(-MAX_HISTORY);
  }
}

function updateOptMenuState() {
  const isOptMenuOpen = optMenu.classList.contains("toggleOptMenu");
  openOptsBtn.setAttribute("aria-expanded", isOptMenuOpen ? "true" : "false");
  openOptsBtn.innerHTML = isOptMenuOpen
    ? `<i class="fas fa-close"></i>`
    : `<i class="fas fa-image"></i>`;
}

if (openOptsBtn) {
  openOptsBtn.addEventListener("click", () => {
    optMenu.classList.toggle("toggleOptMenu");
    updateOptMenuState();
  });
}

uploadImgBtn.addEventListener("click", () => {
  if (galleryInput.value || pendingImage) {
    showConfirm(
      "Uploading another image will replace the current one. Continue?",
      () => {
        galleryInput.click();
      }
    );
  } else {
    galleryInput.click();
  }
});

captureImgBtn.addEventListener("click", () => {
  if (cameraInput.value || pendingImage) {
    showConfirm(
      "Capturing another image will replace the current one. Continue?",
      () => {
        cameraInput.click();
      }
    );
  } else {
    cameraInput.click();
  }
});

// Handle image selection → show in footer
function handleImageSelection(event) {
  optMenu.classList.toggle("toggleOptMenu");
  updateOptMenuState();

  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    pendingImage = reader.result.split(",")[1]; // Base64

    // Remove old preview if exists
    if (pendingPreview) pendingPreview.remove();

    // Create footer preview
    const footer = document.querySelector(".chat-footer");
    const preview = document.createElement("div");
    preview.className = "image-preview";
    preview.innerHTML = `
      <img src="${reader.result}" class="preview">
      <button class="btnII" onclick="removePendingImage()"><i class="fas fa-close"></i></button>
    `;
    footer.insertBefore(preview, footer.firstChild);
    pendingPreview = preview;

    event.target.value = ""; // reset input
  };
  reader.readAsDataURL(file);
}

// Attach to both inputs
galleryInput.addEventListener("change", handleImageSelection);
cameraInput.addEventListener("change", handleImageSelection);

// Remove image before sending
function removePendingImage() {
  pendingImage = null;
  if (pendingPreview) {
    pendingPreview.remove();
    pendingPreview = null;
  }
  galleryInput.value = "";
  cameraInput.value = "";
}




// Send message (text + optional image)
async function sendMessage() {
  if (introBox) introBox.classList.add("hideIntroBox");

  const input = inputField.value.trim();
  if (!input && !pendingImage) return;

  if (pendingPreview) {
    pendingPreview.remove();
    pendingPreview = null;
  }

  let userMsg = input || "";
  if (pendingImage) {
    userMsg += `<br><img src="data:image/png;base64,${pendingImage}" class="preview">`;
  }
  appendMessage("user", userMsg);

  inputField.value = "";
  inputField.style.height = "auto";
  const typingId = showTyping();

  try {
    // ✅ Add new user message to history
    let userParts = [];

    if (input) {
      userParts.push({ text: input });
    } else if (pendingImage) {
      userParts.push({ text: "Describe this image in detail." });
    }
    if (pendingImage) {
      userParts.push({
        inline_data: { mime_type: "image/png", data: pendingImage },
      });
    }
    conversationHistory.push({ role: "user", parts: userParts });
    trimHistory(); // limit size

    // ✅ Send *full history* not just latest
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: conversationHistory }),
    });

    const data = await response.json();
    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "⚠️ Error!";

    // ✅ Add bot reply to history
    conversationHistory.push({ role: "model", parts: [{ text: reply }] });
    trimHistory();

    removeTyping(typingId);
    appendMessage("bot", reply, true);

    // ✅ Save history for reload
    await saveMessage("user", userParts);
    await saveMessage("model", [{ text: reply }]);
  } catch (error) {
    removeTyping(typingId);
    appendMessage("bot", "⚠️ Message didn't send, please retry.");
  } finally {
    pendingImage = null;
  }
}

inputField.addEventListener("input", (e) => {
  const input = e.target.value;

  inputField.style.height = "auto";
  inputField.style.height = inputField.scrollHeight + "px";

  if (input.trim()) {
    sendMessageBtn.disabled = false;
    sendMessageBtn.addEventListener("click", sendMessage);
  } else {
    sendMessageBtn.disabled = true;
    sendMessageBtn.removeEventListener("click", sendMessage);
  }
});

inputField.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});



// Append message to chat
function appendMessage(sender, text, isBot = false) {
  introBox.classList.add("hideIntroBox");
  const chatbox = document.getElementById("chatbox");
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message", sender === "user" ? "user-msg" : "bot-msg");

  // content wrapper
  const contentDiv = document.createElement("div");
  contentDiv.className = "content";
  msgDiv.appendChild(contentDiv);

  // --- 1. Break response into segments (normal text vs fenced code)
  const segments = text.split(/```/);

  segments.forEach((seg, i) => {
    if (i % 2 === 0) {
      // normal text → markdown render + sanitize
      if (seg.trim()) {
        let html = marked.parse(seg);
        html = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
        contentDiv.innerHTML += html;
      }
    } else {
      // code block → detect language
      const firstLineBreak = seg.indexOf("\n");
      let lang = "";
      let code = seg;

      if (firstLineBreak !== -1) {
        lang = seg.slice(0, firstLineBreak).trim();
        code = seg.slice(firstLineBreak + 1);
      }

      // escape dangerous characters so code doesn’t run
      const safeCode = code
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      // wrap in container with copy button
      contentDiv.innerHTML += `
        <div class="code-block">
          <button class="button copy-btn" onclick="copyCode(this)"><i class="fas fa-copy"></i></button>
          <pre><code class="language-${lang}">${safeCode}</code></pre>
        </div>
      `;
    }
  });

  // --- 2. Tools (copy whole message etc)
  if (isBot) {
    const tools = document.createElement("div");
    tools.className = "tools";
    tools.innerHTML = `
      <button copyMsg onclick="copyText(this)">
        <i class="fas fa-copy"></i>
      </button>
    `;
    msgDiv.appendChild(tools);
  }

  chatbox.appendChild(msgDiv);
  // chatbox.scrollTop = chatbox.scrollHeight;

  // --- 3. Highlight only <code> blocks
  msgDiv.querySelectorAll("pre code").forEach((block) => {
    hljs.highlightElement(block);
  });

  // --- 4. Render math if any
  renderMathInElement(msgDiv, {
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "", right: "", display: false },
      { left: "$", right: "$", display: false },
    ],
  });
}

// --- Copy only that code block
function copyCode(btn) {
  const codeBlock = btn.nextElementSibling.querySelector("code");
  const code = codeBlock.innerText;
  navigator.clipboard.writeText(code);

  btn.innerHTML = `<i class="fas fa-check">`;
  btn.classList.add("copied");

  setTimeout(() => {
    btn.innerHTML = `<i class="fas fa-copy">`;
    btn.classList.remove("copied");
  }, 1500);
}
// Typing indicator
function showTyping() {
  const chatbox = document.getElementById("chatbox");
  const typingDiv = document.createElement("div");
  typingDiv.classList.add("message", "bot-msg", "typing");
  typingDiv.innerHTML = `<span class="dot"></span><span class="dot"></span><span class="dot"></span>`;
  chatbox.appendChild(typingDiv);
  chatbox.scrollTop = chatbox.scrollHeight;
  return typingDiv;
}

function removeTyping(typingDiv) {
  typingDiv.remove();
}

// Voice input
let recognition; // global speech recognizer
let cancelled = false; // track if cancelled
let indicator = document.getElementById("recordIndicator");

function startRecording() {
  if (!("webkitSpeechRecognition" in window)) {
    alert("Speech recognition not supported in this browser!");
    return;
  }

  cancelled = false; // reset flag

  recognition = new webkitSpeechRecognition();
  recognition.lang = "en-US";

  indicator.style.display = "block";
  inputBox.classList.add("hides");
  recordSpan.innerHTML = `
    <button class="btnI" onclick="stopRecording()">
      <i class="fas fa-close"></i>
    </button>`;

  recognition.start();

  recognition.onresult = function (e) {
    if (cancelled) return; // do nothing if user canceled
    const transcript = e.results[0][0].transcript;
    document.getElementById("userInput").value = transcript;
    sendMessage();
  };

  recognition.onerror = function (event) {
    console.warn("Speech recognition error:", event.error);

    if (
      event.error === "not-allowed" ||
      event.error === "service-not-allowed"
    ) {
      alert(
        "Microphone access is blocked. Please allow microphone permission in your browser settings."
      );
    } else if (event.error === "network") {
      alert("Network error. Please check your connection.");
    } else if (event.error === "no-speech") {
      alert("No speech detected. Try again.");
    }

    resetRecordingUI();
  };

  recognition.onend = function () {
    if (!cancelled) {
      resetRecordingUI();
    }
  };
}

function stopRecording() {
  if (recognition) {
    cancelled = true; // mark as cancelled
    recognition.stop();
  }
  resetRecordingUI();
}

function resetRecordingUI() {
  indicator.style.display = "none";
  inputBox.classList.remove("hides");
  recordSpan.innerHTML = `
    <button class="btnI" onclick="startRecording()">
      <i class="fas fa-microphone"></i>
    </button>`;
}

// Copy bot text
function copyText(btn) {
  const text = btn.closest(".message").querySelector(".content").innerText;
  navigator.clipboard.writeText(text);

  btn.innerHTML = `<i class="fas fa-check"></i>`;
  btn.classList.add("copied");

  setTimeout(() => {
    btn.innerHTML = `<i class="fas fa-copy"></i>`;
    btn.classList.remove("copied");
  }, 1500);
}

// Speak bot text
function clearBtnState() {
  if (clearBtn.disabled == true) {
    clearBtn.disabled = false;
  }
}

async function saveMessage(role, parts) {
  if (currentUser) {
    const { error } = await supabase.from("chat_history").insert({
      user_id: currentUser.id,
      role,
      parts, // works if jsonb column, else use JSON.stringify(parts)
    });
    if (error) console.error("Supabase save failed:", error.message);
    clearBtnState();
  } else {
    let history = JSON.parse(sessionStorage.getItem("chatHistory")) || [];
    history.push({ role, parts });
    sessionStorage.setItem("chatHistory", JSON.stringify(history));
    clearBtnState();
  }
}

async function loadChatHistory() {
  const chatbox = document.getElementById("chatbox");
  chatbox.innerHTML = "";
  chatbox.innerHTML = `<div class="cell align-center-middle text-cemter><l-tail-chase size="40" speed="1.75" color="lime"></l-tail-chase></div>
`;
  conversationHistory = [];

  if (currentUser) {
    const { data, error } = await supabase
      .from("chat_history")
      .select("role, parts")
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: true });
    clearBtnState();
    if (error) {
      console.error("Supabase load failed:", error.message);
      return;
    }

    data.forEach((msg) => {
      conversationHistory.push(msg);
      appendMessage(
        msg.role === "user" ? "user" : "bot",
        (msg.parts || []).map((p) => p.text || "").join(" "),
        msg.role !== "user"
      );
    });
  } else {
    const history = JSON.parse(sessionStorage.getItem("chatHistory")) || [];
    history.forEach((msg) => {
      conversationHistory.push(msg);
      appendMessage(
        msg.role === "user" ? "user" : "bot",
        (msg.parts || []).map((p) => p.text || "").join(" "),
        msg.role !== "user"
      );
    });
  }
}


document.addEventListener("DOMContentLoaded", loadChatHistory);

if (sessionStorage.getItem("chatHistory") == null) {
  clearBtn.disabled = true;
} else {
  clearBtn.disabled = false;
}

clearBtn.addEventListener("click", () => {
  showConfirm("You are about to clear the chat history, Proceed?", clearChat)
});

async function clearChat() {
  const chatbox = document.getElementById("chatbox");
  chatbox.innerHTML = "";
  conversationHistory = [];

  if (currentUser) {
    // Delete all chat history for this user from Supabase
    const { error } = await supabase
      .from("chat_history")
      .delete()
      .eq("user_id", currentUser.id);

    if (error) {
      console.error("Supabase delete failed:", error.message);
    } else {
      clearBtn.disabled = true;
    }
  } else {
    // If not logged in, clear from sessionStorage
    sessionStorage.removeItem("chatHistory");
    clearBtn.disabled = true;
  }

  // Also clear from localStorage if you're using it for settings
  localStorage.removeItem("chatHistory");
}

//document.addEventListener("DOMContentLoaded", buttonState);
function buttonState() { }


async function showUserProfile(user) {
  const profileDiv = document.getElementById("user-profile");
  const avatar = document.getElementById("user-avatar");
  const nameSpan = document.getElementById("user-name");

  if (!user) {
    profileDiv.style.display = "none";
    // setupDiv.style.display = "none";
    return;
  }

  homeSigninBtn.style.display = "none";
  // Get user profile from Supabase
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("username, avatar")
    .eq("id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching profile:", error.message);
    return;
  }

  // If Google login → use Google metadata
  if (user.app_metadata?.provider === "google") {
    const { name, picture } = user.user_metadata || {};

    nameSpan.textContent = name || profile?.username || "Google User";
    avatar.src =
      picture || profile?.avatar || "default-avatar.png";

    profileDiv.style.display = "block";
    setupDiv.style.display = "none";

    // Sync Google info into profiles table if missing
    await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        username: name || profile?.username || "Google User",
        avatar: picture || profile?.avatar || null,
        email: user.email,
      });
  }
  // For email/password users
  else {
    if (profile && profile.username) {
      nameSpan.textContent = profile.username;
      avatar.src = profile.avatar || "default-avatar.png";
      profileDiv.style.display = "block";
      setupDiv.style.display = "none";
    } else {
      profileDiv.style.display = "none";
      //setupDiv.style.display = "block";
      window.location.href = "profile-setup.html";
    }
  }
}

// ✅ On load, fetch current session and show profile
document.addEventListener("DOMContentLoaded", async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user) {
    currentUser = session.user;
    await showUserProfile(currentUser);
    console.log("Current user:", currentUser);
  } else {
    document.getElementById("user-profile").style.display = "none";
    document.getElementById("setup-username").style.display = "none";
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  const { data: { user } } = await supabase.auth.getUser();

  // If not logged in, show dialog
  if (!user) {
    const dialog = document.getElementById("login-dialog");
    dialog.style.display = "flex";

    // Handle login
    document.getElementById("login-btn").addEventListener("click", () => {
      window.location.href = "login.html"; // change if needed
    });

    // Handle continue as guest
    document.getElementById("continue-btn").addEventListener("click", () => {
      dialog.style.display = "none";
    });
  }
});

const menu = document.querySelector(".menu");
const toggleButton = document.querySelector(".menu-toggle");
const menuItems = document.querySelectorAll(".menu  li"); // Adjust selector if needed

function updateMenuState() {
  const isMenuOpen = menu.classList.contains("show");
  toggleButton.setAttribute("aria-expanded", isMenuOpen ? "true" : "false");
  toggleButton.innerHTML = isMenuOpen
    ? `<i class="fas fa-close"></i>`
    : `<i class="fas fa-bars"></i>`;
}

toggleButton.addEventListener("click", (event) => {
  event.stopPropagation(); // ✅ Prevent click from bubbling to document
  menu.classList.toggle("show");
  updateMenuState();
});

// ✅ Close when clicking outside the menu
document.addEventListener("click", (event) => {
  const isClickInsideMenu = menu.contains(event.target);
  const isClickOnToggle = toggleButton.contains(event.target);

  if (
    !isClickInsideMenu &&
    !isClickOnToggle &&
    menu.classList.contains("show")
  ) {
    menu.classList.remove("show");
    updateMenuState();
  }
});

menuItems.forEach((item) => {
  item.addEventListener("click", () => {
    menu.classList.remove("show");
    updateMenuState();
  });
});
