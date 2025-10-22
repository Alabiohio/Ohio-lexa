// CAMERA FIX AND NOTIFY DIALOGUE
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import "katex/dist/katex.min.css";
import renderMathInElement from "katex/contrib/auto-render";
import { supabase } from './../../supabaseClient'
let currentUser = null;


const { marked } = require('marked');


const API_KEY = "AIzaSyDWnyPqVNNhHd7Q2HElWqhUiUuShs0hwDs";
const model = "gemini-2.0-flash";
export const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=` + API_KEY;
const inputBox = document.getElementById("userInputBox");
const recordSpan = document.getElementById("rcdSpan");
export let conversationHistory = [];
const MAX_HISTORY = 20; // keep last 20 messages (10 user+bot exchanges)

document.addEventListener("DOMContentLoaded", async () => {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (user) {
        currentUser = user;
    }
    //await loadChatHistory(); // load from Supabase if logged in, else from sessionStorage
});

function trimHistory() {
    if (conversationHistory.length > MAX_HISTORY) {
        conversationHistory = conversationHistory.slice(-MAX_HISTORY);
    }
}

export async function sendMessage(
    pendingImage,
    setImagePreview,
    setIsMesPresent,
    messageText
) {
    setIsMesPresent(setIsMesPresent ? true : false);
    const input = messageText;

    if (!input && !pendingImage) return;

    if (pendingImage) {
        setImagePreview(null)
    }


    let userMsg = input || "";
    if (pendingImage) {
        userMsg += `<br><img src="data:image/png;base64,${pendingImage}" class="preview">`;
    }
    appendMessage("user", userMsg);

    //inputField.value = "";
    //inputField.style.height = "auto";
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


// Append message to chat
export function appendMessage(sender, text, isBot = false) {
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

    //saveMessage();
}

// Copy bot text
window.copyText = function (btn) {
    const messageDiv = btn.closest(".message");
    const content = messageDiv.querySelector(".content")?.innerText;
    if (!content) return;
    navigator.clipboard.writeText(content).then(() => {
        btn.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
            btn.innerHTML = '<i class="fas fa-copy"></i>';
        }, 1000);
    });
};

// --- Copy only that code block
window.copyCode = function (btn) {
    const code = btn.nextElementSibling?.innerText;
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
        btn.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
            btn.innerHTML = '<i class="fas fa-copy"></i>';
        }, 1000);
    });
}

// Typing indicator
export function showTyping() {
    const chatbox = document.getElementById("chatbox");
    const typingDiv = document.createElement("div");
    typingDiv.classList.add("message", "bot-msg", "typing");
    typingDiv.innerHTML = `<span class="dot"></span><span class="dot"></span><span class="dot"></span>`;
    chatbox.appendChild(typingDiv);
    chatbox.scrollTop = chatbox.scrollHeight;
    return typingDiv;
}

export function removeTyping(typingDiv) {
    typingDiv.remove();
}
/*
// Voice input
let recognition;       // global speech recognizer
let cancelled = false; // track if cancelled
let indicator = document.getElementById("recordIndicator");
*/
let recognition; // global speech recognition instance
let cancelled = false; // track if cancelled
const indicator = document.getElementById("recordIndicator");
//const inputBox = document.getElementById("userInputBox");
//const recordSpan = document.getElementById("rcdSpan");

// --- Reset UI after recording
export function resetRecordingUI() {
    indicator.style.display = "none";
    inputBox.classList.remove("hides");
    recordSpan.innerHTML = `
        <button class="btnI" onclick="startRecording()" title="record audio" aria-label="record audio">
            <i class="fas fa-microphone"></i>
        </button>
    `;
}

// --- Start Recording
export function startRecording() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        alert("Speech recognition not supported in this browser!");
        return;
    }

    cancelled = false;

    recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false; // only final results

    indicator.style.display = "block";
    inputBox.classList.add("hides");
    recordSpan.innerHTML = `
        <button class="btnI" onclick="stopRecording()" title="stop recording" aria-label="stop recording">
            <i class="fas fa-close"></i>
        </button>
    `;

    recognition.start();

    recognition.onresult = (e) => {
        if (cancelled) return;
        const transcript = e.results[0][0].transcript.trim();
        document.getElementById("userInput").value = transcript;
        sendMessage();
    };

    recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);

        switch (event.error) {
            case "not-allowed":
            case "service-not-allowed":
                alert("Microphone access is blocked. Please allow it in browser settings.");
                break;
            case "network":
                alert("Network error. Please check your internet connection.");
                break;
            case "no-speech":
                alert("No speech detected. Try again.");
                break;
            default:
                alert("Speech recognition error: " + event.error);
        }

        resetRecordingUI();
    };

    recognition.onend = () => {
        if (!cancelled) resetRecordingUI();
    };
}

// --- Stop Recording
export function stopRecording() {
    if (recognition) {
        cancelled = true;
        recognition.stop();
    }
    resetRecordingUI();
}



// Speak bot text

async function saveMessage(role, parts) {
    if (currentUser) {
        const { error } = await supabase.from("chat_history").insert({
            user_id: currentUser.id,
            role,
            parts, // works if jsonb column, else use JSON.stringify(parts)
        });
        if (error) console.error("Supabase save failed:", error.message);
        // clearBtnState();
    } else {
        let history = JSON.parse(sessionStorage.getItem("chatHistory")) || [];
        history.push({ role, parts });
        sessionStorage.setItem("chatHistory", JSON.stringify(history));
        // clearBtnState();
    }
}


const dialogOverlay = document.getElementById("customDialog");
const dialogMessage = document.getElementById("dialogMessage");
const dialogButtons = document.getElementById("dialogButtons");

// Confirm dialog
export function showConfirm(message, onOk, onCancel) {
    dialogMessage.textContent = message;
    dialogButtons.innerHTML = `
      <button class="dialog-button btn-cancel">Cancel</button>
      <button class="dialog-button btn-ok">OK</button>
    `;
    dialogOverlay.style.display = "flex";

    // Button handlers
    dialogButtons.querySelector(".btn-ok").onclick = () => {
        dialogOverlay.style.display = "none";
        if (typeof onOk === "function") onOk();
    };
    dialogButtons.querySelector(".btn-cancel").onclick = () => {
        dialogOverlay.style.display = "none";
        if (typeof onCancel === "function") onCancel();
    };
}

// Info dialog (only OK)
export function showInfo(message, onOk) {
    dialogMessage.textContent = message;
    dialogButtons.innerHTML = `
      <button class="dialog-button btn-ok">OK</button>
    `;
    dialogOverlay.style.display = "flex";

    dialogButtons.querySelector(".btn-ok").onclick = () => {
        dialogOverlay.style.display = "none";
        if (typeof onOk === "function") onOk();
    };
}
//showConfirm("Are you sure?", () => alert("Confirmed!"), () => alert("Cancelled"));



