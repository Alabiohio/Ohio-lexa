const API_KEY = "AIzaSyDWnyPqVNNhHd7Q2HElWqhUiUuShs0hwDs";
const model = "gemini-2.0-flash";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=` + API_KEY;
const introBox = document.querySelector(".introBox");
const inputBox = document.getElementById("userInputBox");
const recordSpan = document.getElementById("rcdSpan");

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
function appendMessage(sender, text, isBot = false) {
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
          <button class="copy-btn" onclick="copyCode(this)">📋</button>
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
      <button onclick="copyText(this.closest('.message').querySelector('.content').innerText)">
        <i class="fas fa-copy"></i>
      </button>
    `;
    msgDiv.appendChild(tools);
  }

  chatbox.appendChild(msgDiv);
  chatbox.scrollTop = chatbox.scrollHeight;

  // --- 3. Highlight only <code> blocks
  msgDiv.querySelectorAll("pre code").forEach(block => {
    hljs.highlightElement(block);
  });

  // --- 4. Render math if any
  renderMathInElement(msgDiv, {
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "\", right: "\", display: false },
      { left: "$", right: "$", display: false }
    ]
  });

  saveChatHistory();
}

// --- Copy only that code block
function copyCode(btn) {
  const codeBlock = btn.nextElementSibling.querySelector("code");
  const code = codeBlock.innerText;
  navigator.clipboard.writeText(code);

  btn.textContent = "✅";
  btn.classList.add("copied");

  setTimeout(() => {
    btn.textContent = "📋";
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
let recognition;       // global speech recognizer
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
    <button class="button btnI" onclick="stopRecording()">
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

    if (event.error === "not-allowed" || event.error === "service-not-allowed") {
      alert("Microphone access is blocked. Please allow microphone permission in your browser settings.");
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
    <button class="button btnI" onclick="startRecording()">
      <i class="fas fa-microphone"></i>
    </button>`;
}


// Copy bot text
function copyText(text) {
  navigator.clipboard.writeText(text);
  //alert("Copied!");
}

// Speak bot text

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



