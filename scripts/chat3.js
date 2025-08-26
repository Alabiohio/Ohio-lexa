const API_KEY = "AIzaSyDWnyPqVNNhHd7Q2HElWqhUiUuShs0hwDs";
const model = "gemini-2.0-flash";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=` + API_KEY;
const introBox = document.querySelector(".introBox");

let pendingImage = null;
let pendingPreview = null;

// Handle image selection → show in footer
document.getElementById("imageInput").addEventListener("change", (event) => {
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
    
    event.target.value = "";
  };
  reader.readAsDataURL(file);
});

// Remove image before sending
function removePendingImage() {
  pendingImage = null;
  if (pendingPreview) {
    pendingPreview.remove();
    pendingPreview = null;
  }
}

// Send message (text + optional image)
async function sendMessage() {
  
  if (introBox) {
    introBox.classList.add("hideIntroBox");
  }

  const inputField = document.getElementById("userInput");
  const input = inputField.value.trim();
  if (!input && !pendingImage) return;

  // Move image preview to chat
  if (pendingPreview) {
    pendingPreview.remove();
    pendingPreview = null;
  }

  // Show user message (with image if exists)
  let userMsg = input || "";
  if (pendingImage) {
    userMsg += `<br><img src="data:image/png;base64,${pendingImage}" class="preview">`;
  }
  appendMessage("user", userMsg);

  inputField.value = "";
  const typingId = showTyping();

  try {
    let parts = [];
    if (input) parts.push({ text: input });
    if (pendingImage) parts.push({ inline_data: { mime_type: "image/png", data: pendingImage } });

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts }] })
    });

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "⚠️ Error!";
    removeTyping(typingId);
    appendMessage("bot", reply, true);

  } catch (error) {
    removeTyping(typingId);
    appendMessage("bot", "⚠️ Network error!");
  } finally {
    pendingImage = null;
  }
}

// Append message to chat
function appendMessage(sender, text, isBot=false) {
  const chatbox = document.getElementById("chatbox");
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message", sender === "user" ? "user-msg" : "bot-msg");
  msgDiv.innerHTML = `<p>${text}</p>`;

  if (isBot) {
    const tools = document.createElement("div");
    tools.className = "tools";
    tools.innerHTML = `
      <button onclick="copyText(\`${text.replace(/`/g,"\\`")}\`)"><i class="fas fa-copy"></i></button>
      <button onclick="speakText(\`${text.replace(/`/g,"\\`")}\`)"><i class="fas fa-volume-up"></i></button>
    `;
    msgDiv.appendChild(tools);
  }

  chatbox.appendChild(msgDiv);
  chatbox.scrollTop = chatbox.scrollHeight;

  // --- Save to localStorage ---
  saveChatHistory();
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
function startRecording() {
  if (!("webkitSpeechRecognition" in window)) {
    alert("Speech recognition not supported!");
    return;
  }
  const recognition = new webkitSpeechRecognition();
  recognition.lang = "en-US";
  recognition.start();
  recognition.onresult = function (e) {
    const transcript = e.results[0][0].transcript;
    document.getElementById("userInput").value = transcript;
    sendMessage();
  };
}

// Copy bot text
function copyText(text) {
  navigator.clipboard.writeText(text);
  alert("Copied!");
}

// Speak bot text
function speakText(text) {
  const utter = new SpeechSynthesisUtterance(text);
  speechSynthesis.speak(utter);
}

function removePendingImage() {
  pendingImage = null;
  if (pendingPreview) {
    pendingPreview.remove();
    pendingPreview = null;
  }
  document.getElementById("imageInput").value = ""; // reset file input
}


function saveChatHistory() {
  const chatbox = document.getElementById("chatbox");
  const messages = [];
  
  chatbox.querySelectorAll(".message").forEach(msg => {
    messages.push({
      sender: msg.classList.contains("user-msg") ? "user" : "bot",
      html: msg.innerHTML   // store as HTML so previews/tools remain
    });
  });

  localStorage.setItem("chatHistory", JSON.stringify(messages));
}

function loadChatHistory() {
  const chatbox = document.getElementById("chatbox");
  const stored = localStorage.getItem("chatHistory");
  if (!stored) return;

  if (introBox) {
    introBox.classList.add("hideIntroBox");
  } else {
      introBox.classList.remove("hideIntroBox");
  }
  
  const messages = JSON.parse(stored);
  messages.forEach(msg => {
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message", msg.sender === "user" ? "user-msg" : "bot-msg");
    msgDiv.innerHTML = msg.html;
    chatbox.appendChild(msgDiv);
  });
  chatbox.scrollTop = chatbox.scrollHeight;
}

document.addEventListener("DOMContentLoaded", loadChatHistory);

const clearBtn = document.getElementById('clrBtn');
clearBtn.addEventListener('click', clearChat);

function clearChat() {
  document.getElementById("chatbox").innerHTML = "";
  localStorage.removeItem("chatHistory");
  introBox.classList.remove("hideIntroBox");
}


const menu = document.querySelector('.menu');
const toggleButton = document.querySelector('.menu-toggle');
const menuItems = document.querySelectorAll('.menu  li'); // Adjust selector if needed

function updateMenuState() {
  const isMenuOpen = menu.classList.contains('show');
  toggleButton.setAttribute("aria-expanded", isMenuOpen ? "true" : "false");
  toggleButton.innerHTML = isMenuOpen
    ? `<i class="fas fa-close"></i>`
    : `<i class="fas fa-bars"></i>`;
}

toggleButton.addEventListener('click', (event) => {
  event.stopPropagation(); // ✅ Prevent click from bubbling to document
  menu.classList.toggle('show');
  updateMenuState();
});

// ✅ Close when clicking outside the menu
document.addEventListener('click', (event) => {
  const isClickInsideMenu = menu.contains(event.target);
  const isClickOnToggle = toggleButton.contains(event.target);

  if (!isClickInsideMenu && !isClickOnToggle && menu.classList.contains('show')) {
    menu.classList.remove('show');
    updateMenuState();
  }
});

menuItems.forEach(item => {
  item.addEventListener('click', () => {
    menu.classList.remove('show');
    updateMenuState();
  });
});


