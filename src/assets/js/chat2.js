// CAMERA FIX AND NOTIFY DIALOGUE
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import "katex/dist/katex.min.css";
import renderMathInElement from "katex/contrib/auto-render";
import jsQR from "jsqr";
import { supabase } from './../../supabaseClient'
let currentUser = null;


const { marked } = require('marked');


const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const model = "gemini-2.0-flash";
export const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=` + API_KEY;
const inputBox = document.getElementById("userInputBox");
const recordSpan = document.getElementById("rcdSpan");
export let conversationHistory = [];
const MAX_HISTORY = 20; // keep last 20 messages (10 user+bot exchanges)
const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_CUSTOM_SEARCH_API_KEY;
const SEARCH_ENGINE_ID = process.env.REACT_APP_SEARCH_ENGINE_ID;

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


// Detect if web search is needed using AI
async function shouldSearchWeb(input) {
    const decisionPrompt = `
Does this user query require current, factual, or real-time web data to answer correctly?
Examples: news, prices, rankings, release dates, "who is", "latest", "how many", etc.
Answer only "yes" or "no" — no explanation.
Say yes if the user says search.

Query: "${input}"
`;

    try {
        const decisionRes = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: decisionPrompt }] }],
            }),
        });

        const decisionData = await decisionRes.json();
        const responseText =
            decisionData.candidates?.[0]?.content?.parts?.[0]?.text?.toLowerCase() || "";
        return responseText.includes("yes");
    } catch (err) {
        console.warn("AI detection failed, defaulting to false:", err);
        return false;
    }
}

// --- Web search function ---
async function searchTheWeb(query) {
    const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${encodeURIComponent(
        query
    )}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.items || data.items.length === 0) return null;

    const topResults = data.items.slice(0, 5).map((item) => ({
        title: item.title,
        snippet: item.snippet,
        link: item.link,
    }));

    return topResults;
}


// --- Helper: check if model reply is weak/incomplete ---
function looksIncomplete(reply) {
    const signals = [
        "i don't know",
        "i’m not sure",
        "cannot find",
        "sorry",
        "as an ai",
        "not available",
        "unknown",
        "no data",
        "i have no information",
        "As a large language model",
    ];
    return signals.some((s) => reply.toLowerCase().includes(s));
}

// 🧩 QR decoding helper
async function decodeQRCodeFromBase64(base64) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = function () {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0, img.width, img.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, canvas.width, canvas.height);
            resolve(code ? code.data : null);
        };
        img.src = `data:image/png;base64,${base64}`;
    });
}



let sWNeedsWeb = false;

export function searchWeb(toggle) {
    if (toggle) {
        sWNeedsWeb = true;
    } else {
        sWNeedsWeb = false;
    }
    return sWNeedsWeb;
}

export async function sendMessage(
    pendingImage,
    setImagePreview,
    setIsMesPresent,
    messageText
) {
    setIsMesPresent(setIsMesPresent ? true : false);
    const input = messageText;
    let userParts = [];

    let qrText = null;


    if (!input && !pendingImage) return;


    // 🧩 Combine text + image for display
    let userMsg = input || "";
    if (pendingImage) {
        qrText = await decodeQRCodeFromBase64(pendingImage);

        if (qrText) {
            userParts.push({ text: `Using the following qr code result, tell the user the content of the qr code, then offer help suggestions based on the qr code results if you think it's needed ${qrText}` });
        }

        // ✅ Only add “Describe this image...” when there’s an image *and no input or QR*
        if (!input && !qrText) {
            userParts.push({ text: "Describe this image in detail." });
        }

        userParts.push({
            inline_data: { mime_type: "image/png", data: pendingImage },
        });

        userMsg += `<br><img src="data:image/png;base64,${pendingImage}" class="preview">`;
    }
    appendMessage("user", userMsg);

    if (pendingImage) {
        setImagePreview(null);
        pendingImage = null;
    }

    const typingId = showTyping();

    try {
        // --- Build parts to send to the model ---
        if (input) {
            userParts.push({ text: input });
        }

        setImagePreview(null);
        pendingImage = null;

        const queryText = input || qrText || "Describe this image in detail.";
        const modelParts = [...userParts];

        setImagePreview(null)

        // Store for history (exclude fallback text)
        const storedUserParts = userParts.filter(p => {
            if (!p.text) return true;

            const txt = p.text.trim();
            const isDescribeFallback = txt.startsWith("Describe this image in detail.");
            const isQrTextOnly = txt.startsWith(`Using the following qr code result, tell the user the content of the qr code, then offer help suggestions based on the qr code results if you think it's needed ${qrText}`) && userParts.length === 1;
            const isQrText = txt === `Using the following qr code result, tell the user the content of the qr code, then offer help suggestions based on the qr code results if you think it's needed ${qrText}`;
            // const isQrFallback = txt.startsWith(`This is a QR code. The decoded text is:\n"${qrText}"`);

            // Always skip fallback text
            if (isDescribeFallback) return false;

            // Skip QR text if user typed anything, or if you never want to save QR automatically
            if (isQrText) return false;
            if (isQrTextOnly) return false;

            return true;
        });

        const needsWebBtn = await searchWeb(sWNeedsWeb);

        const needsWeb = await shouldSearchWeb(queryText);


        if (needsWeb || needsWebBtn) {

            removeTyping(typingId);
            appendMessage("bot", "🔍 Searching the web...", true);

            const results = await searchTheWeb(input || "image description");
            if (!results) {
                appendMessage("bot", "❌ No results found on the web.", true);
                return;
            }

            const context = results
                .map((r, i) => `[${i + 1}] ${r.title}: ${r.snippet}`)
                .join("\n\n");

            const prompt = `
Using the following web search results, write a factual, helpful, and natural response to the user's query.
Cite sources inline using [1], [2], etc.

User query: "${input || 'Describe this image in detail'}"

Web results:
${context}
`;

            const res = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ role: "user", parts: [{ text: prompt }] }],
                }),
            });

            const data = await res.json();
            const answer =
                data.candidates?.[0]?.content?.parts?.[0]?.text ||
                "⚠️ I couldn’t form a summary from the web results.";

            // Turn [1], [2] into clickable links
            let formattedAnswer = answer;
            results.forEach((r, i) => {
                const linkTag = `<sup><a href="${r.link}" target="_blank" class="source-link" title="${r.link}">[${i + 1}]</a></sup>`;
                formattedAnswer = formattedAnswer.replace(
                    new RegExp(`\\[${i + 1}\\]`, "g"),
                    linkTag
                );
            });

            appendMessage("bot", formattedAnswer, true);
            await saveMessage("user", storedUserParts);
            await saveMessage("model", [{ text: formattedAnswer }]);

            // ✅ KEEP HISTORY CONTEXT
            conversationHistory.push({ role: "user", parts: [{ text: input || "Describe this image in detail" }] });
            conversationHistory.push({ role: "model", parts: [{ text: formattedAnswer }] });
            trimHistory();

            return;
        }

        // --- STEP 2: Normal model processing ---
        conversationHistory.push({ role: "user", parts: modelParts });
        trimHistory();

        // ✅ Send *full history* not just latest
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: conversationHistory }),
        });

        const data = await response.json();
        let reply =
            data.candidates?.[0]?.content?.parts?.[0]?.text || "⚠️ Error!";

        // --- STEP 3: Retry via web if reply looks incomplete ---
        if (looksIncomplete(reply) || reply.trim() === "") {
            appendMessage("bot", "🤔 Let me check the web for accurate info...", true);

            const results = await searchTheWeb(input || "image description");
            if (!results) {
                appendMessage("bot", "❌ No results found online.", true);
                return;
            }

            const context = results
                .map((r, i) => `Result ${i + 1}:\nTitle: ${r.title}\nSnippet: ${r.snippet}\nURL: ${r.link}`)
                .join("\n\n");

            const prompt = `
Answer this query factually in a conversational tone using the web results below.
Cite sources inline like [1], [2], etc.

User query: "${input || 'Describe this image in detail'}"

Web results:
${context}
`;

            const res2 = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ role: "user", parts: [{ text: prompt }] }],
                }),
            });

            const data2 = await res2.json();
            reply = data2.candidates?.[0]?.content?.parts?.[0]?.text || "⚠️ Couldn't summarize results.";

            results.forEach((r, i) => {
                const linkTag = `<sup><a href="${r.link}" target="_blank" class="source-link" title="${r.link}">[${i + 1}]</a></sup>`;
                reply = reply.replace(new RegExp(`\\[${i + 1}\\]`, "g"), linkTag);
            });
        }

        // ✅ Add bot reply to history
        conversationHistory.push({ role: "model", parts: [{ text: reply }] });
        trimHistory();

        removeTyping(typingId);
        appendMessage("bot", reply, true);

        // ✅ Save history for reload
        await saveMessage("user", storedUserParts);
        await saveMessage("model", [{ text: reply }]);
    } catch (error) {
        console.error(error);
        removeTyping(typingId);
        appendMessage("bot", "⚠️ Message didn't send, please retry.");
        return null;
        // appendMessage("bot", `<button class='button' onclick="alert('hi')"><i class='fas fa-refresh retry'></i></button>`)
    } finally {
        pendingImage = null;
        setImagePreview(null);
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

    /*
        if (text.startsWith("⚠️ Message didn't send, please retry.")) {
            const retryCont = document.createElement("div");
            retryCont.className = "retry";
            retryCont.innerHTML = `<button class='retryBtn' onclick="resendMessage()"><i class='fas fa-refresh retry'></i>Retry</button>`;
            msgDiv.appendChild(retryCont);
        }
    */

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
            { left: "\\(", right: "\\)", display: false },
            { left: "$", right: "$", display: false }
        ]
    });

    //saveMessage();
}

/*
window.resendMessage = async function () {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: conversationHistory }),
        });

        const data = await response.json();
        let reply =
            data.candidates?.[0]?.content?.parts?.[0]?.text || "⚠️ Error!";

        appendMessage("bot", reply, true);

    } catch {
        showInfo("Couldn't send message")
    }
} */

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
    // ✅ Convert all parts into Gemini-safe JSON
    const cleanParts = parts.map(p => {
        const safePart = {};

        // Include text only if it exists
        if (p.text) {
            safePart.text = p.text;
        }

        // If inline data exists (like base64 images), convert safely
        if (p.inline_data) {
            safePart.inline_data = {
                mime_type: p.inline_data.mime_type || "text/plain",
                data: p.inline_data.data || ""
            };
        }

        return safePart;
    });

    try {
        if (currentUser) {
            const { error } = await supabase
                .from("chat_history")
                .insert({
                    user_id: currentUser.id,
                    role,
                    parts: cleanParts
                });

            if (error) {
                console.error("Supabase save failed:", error.message);
            }
        } else {
            // Local session fallback
            const history = JSON.parse(sessionStorage.getItem("chatHistory")) || [];
            history.push({ role, parts: cleanParts });
            sessionStorage.setItem("chatHistory", JSON.stringify(history));
        }
    } catch (err) {
        console.error("Error saving message:", err);
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


    const okBtn = dialogButtons.querySelector(".btn-ok");
    okBtn.onKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            dialogOverlay.style.display = "none";
        }
    }
    okBtn.onclick = () => {
        dialogOverlay.style.display = "none";
        if (typeof onOk === "function") onOk();
    };
}


//showConfirm("Are you sure?", () => alert("Confirmed!"), () => alert("Cancelled"));



