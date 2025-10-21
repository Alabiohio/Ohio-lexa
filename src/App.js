import React, { useState, useRef, useEffect, use } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation
} from "react-router-dom";
import 'foundation-sites/dist/css/foundation.min.css';
import './App.css';
import './assets/css/cssI.css';
import { sendMessage, conversationHistory, appendMessage } from './assets/js/chat2.js';
import Menu from "./components/menu";
import Login from "./components/Login";
import Signup from "./components/Signup";
import ProfileSetup from "./components/ProfileSetup";
import About from "./components/About";
import Terms from "./components/Terms";
import Privacy from "./components/Privacy";
import logoTr from './assets/images/logo-tr.png';
import { handleImageSelection } from './utils/imageUtils.js';
import { useSpeechRecognition } from './utils/voiceUtils.js';
import { supabase } from './supabaseClient.js';
import useRealTimeInternetStatus from "./assets/js/onlineStatus.js";

export let chatContainer;
export let isMsgPresent;

function NetworkStatusBanner() {
  const isOnline = useRealTimeInternetStatus(5000); // check every 10s

  if (isOnline) return null; // ✅ Only show if disconnected

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        backgroundColor: "#ff4d4dde",
        color: "#fff",
        textAlign: "center",
        padding: "5px 0",
        zIndex: 9999,
        fontWeight: "600",
        letterSpacing: "0.5px",
        boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
        transition: "all 0.3s ease",
      }}
    >
      <i className="fas fa-signal" style={{ color: 'black', marginRight: "8px" }}></i>
      You’re offline. Some features may not work.
    </div>
  );
}

function Home() {
  const [isMedOpen, setIsMedOpen] = useState(false);
  const [pendingImage, setPendingImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [resetInputValue, setResetInputValue] = useState(false);
  const [isMsgPresent, setIsMesPresent] = useState(false);
  const [isUser, setIsUser] = useState(null); // <-- Moved useState here
  const userInputRef = useRef(null); // add this ref for the textarea
  const [text, setText] = useState(null);
  const sendBtnRef = useRef(null);
  const loginDialogRef = useRef(null);
  const navigate = useNavigate();
  const introBoxRef = useRef(null);

  const toggleMedOpt = () => setIsMedOpen((prev) => !prev);

  const uploadImgBtnRef = useRef(null);
  const captureImgBtnRef = useRef(null);

  const chatboxRef = useRef(null);
  chatContainer = chatboxRef.current;

  useEffect(() => {
    // Initial check
    if (chatContainer) {
      setIsMesPresent(chatContainer.children.length > 0);
    }

    // Optional: track changes dynamically
    const observer = new MutationObserver(() => {
      if (chatContainer) {
        setIsMesPresent(chatContainer.children.length > 0);
      }
    });
    if (chatContainer) {
      observer.observe(chatContainer, { childList: true });
    }

    return () => observer.disconnect();
  }, [isMsgPresent]);

  const handleUploadBtn = () => {
    uploadImgBtnRef.current?.click();
  }
  const handleCaptureBtn = () => {
    captureImgBtnRef.current?.click();
  }


  const onImageSelection = (event) => {
    handleImageSelection(
      event,
      setPendingImage,
      setImagePreview,
      toggleMedOpt,
      setResetInputValue
    );
    setText(true);
  };
  function removePendingImage() {
    setPendingImage(null);
    setImagePreview(null);
    setText(false);
  }

  const onSendMessage = async () => {
    const inputValue = userInputRef.current.value;
    setText(inputValue);
    sendMessage(
      pendingImage,
      setImagePreview,
      setIsMesPresent,
      inputValue
    );
    userInputRef.current.value = "";
    userInputRef.current.style.height = "auto";
    setText(!text);
  };

  const { isRecording, startRecording, stopRecording } = useSpeechRecognition(sendVMessage);
  function sendVMessage(voiceText) {
    sendMessage(null, null, setIsMesPresent, voiceText);
  }

  const onMsgInputChange = () => {
    const text = userInputRef.current.value;
    setText(text);

    userInputRef.current.style.height = "auto";
    userInputRef.current.style.height = userInputRef.current.scrollHeight + "px";

  }

  const onMsgInputKeydown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  }

  const fetchedRef = useRef(false);

  useEffect(() => {
    const checkUserAndMessages = async () => {
      if (fetchedRef.current) return; // 👈 prevent multiple runs
      fetchedRef.current = true;

      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      setIsUser(user);

      if (user) {
        const { data, error } = await supabase
          .from("chat_history")
          .select("role, parts")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });

        if (error) {
          console.error("Supabase load failed:", error.message);
          return;
        }

        // Clear old messages before appending
        conversationHistory.length = 0;
        const chatBox = document.getElementById("chatbox")
        if (chatBox) {
          chatBox.innerHTML = "";
        }


        if (!data || data.length === 0) {
          //  alert("No messages found in your chat history.");
          setIsMesPresent(false);
          return; // stop further execution
        }

        setIsMesPresent(true);
        data.forEach((msg) => {
          conversationHistory.push(msg);
          appendMessage(
            msg.role === "user" ? "user" : "bot",
            (msg.parts || []).map((p) => p.text || "").join(" "),
            msg.role !== "user"
          );
        });

        if (chatboxRef.current) {
          chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
        }
      } else {
        const dialog = loginDialogRef.current;
        if (dialog) {
          dialog.style.display = "flex"; // show dialog initially
        }
        return () => {
          if (dialog) dialog.style.display = "none";
        };
      }
    };

    checkUserAndMessages();
  }, []);


  useEffect(() => {
    if (chatboxRef.current) {
      chatboxRef.current.scrollTo({
        top: chatboxRef.current.scrollHeight,
        behavior: "smooth", // 👈 smooth scrolling animation
      });
    }
  }, []);

  const noLogin = () => {
    const dialog = loginDialogRef.current;
    if (dialog) {
      dialog.style.display = "none"; // hide dialog on continue without login
    }
  }

  const goToLogin = () => {
    navigate('/login')
  }

  return (
    <div>
      <div
        id="login-dialog"
        ref={loginDialogRef}
        className="login-dialog-overlay"
      >
        <div className="login-dialog-box">
          <h3>Welcome!</h3>
          <p>
            You’re not logged in. Please log in to access all features or
            continue as a guest.
          </p>
          <div className="dialog-buttons">
            <button id="login-btn" onClick={goToLogin}>
              Login
            </button>
            <button id="continue-btn" onClick={noLogin}>
              Continue without login
            </button>
          </div>
        </div>
      </div>
      <NetworkStatusBanner />

      {!isMsgPresent && (
        <div className="cell align-center-middle text-center introBox" ref={introBoxRef}>
          <h1 className="ai-effect">Ohio Lexa</h1>
        </div>
      )}

      <div className="grid-container full chatbot-container">
        <div className="grid-x cell chat-window">

          <div id="chatbox" ref={chatboxRef} className="cell chat-body"></div>

          <div className="grid-x chat-footer">

            {imagePreview && (
              <div>
                <img src={imagePreview} class="preview" alt='preview' />
                <button class="btnII" onClick={removePendingImage}><i class="fas fa-close"></i></button>
              </div>
            )}
            <div className={`cell optDiv ${isMedOpen ? 'toggleOptMenu' : ''}`}>
              <button id="uploadImgBtn" onClick={handleUploadBtn} title="upload image" aria-label="upload image"><i
                className="fas fa-image"></i></button>
              <button id="captureImgBtn" onClick={handleCaptureBtn} title="capture image"
                aria-label="capture image"><i className="fas fa-camera"></i></button>
            </div>

            <div className="cell">
              <input type="file" id="galleryInput" ref={uploadImgBtnRef} onChange={onImageSelection} accept="image/*" hidden />
              <input type="file" id="cameraInput" ref={captureImgBtnRef} onChange={onImageSelection} accept="image/*" capture="environment" hidden />
            </div>

            <div className="cell small-1 medium-1 large-1 align-center-middle text-center" style={{ marginRight: '25px' }}>
              <button className="btnI" id="openMedOpts" onClick={toggleMedOpt} aria-label="Media options" aria-expanded="false"
                title="Media options"><i className={isMedOpen ? 'fas fa-close' : 'fas fa-image'}></i></button>
            </div>

            {!isRecording ? (
              <div className="cell small-7 medium-7 large-7 align-center-middle text-center" id="userInputBox"
                style={{ marginRight: '25px' }}>
                <div className="chat-input-container">
                  <textarea id="userInput" ref={userInputRef} onInput={onMsgInputChange} onKeyDown={onMsgInputKeydown} placeholder="Type a message..." rows="1"></textarea>
                </div>
              </div>
            ) : (
              <div id="recordIndicator" className="cell small-7 medium-7 large-7 align-center-middle text-center record-indicator">
                Listening...
              </div>
            )}

            <div className="cell small-2 medium-2 large-2 msg-rec align-center-middle text-center">
              <button
                className="btnI"
                id="sendMessageBtn"
                ref={sendBtnRef}
                onClick={onSendMessage}
                title="send message"
                aria-label="send message"
                disabled={!text}
              >
                <i className="fas fa-arrow-up"></i>
              </button>
              <span id="rcdSpan">

                {isRecording ? (
                  <button className="btnI" onClick={stopRecording}>
                    <i className="fas fa-close"></i>
                  </button>
                ) : (
                  <button className="btnI" onClick={startRecording}>
                    <i className="fas fa-microphone"></i>
                  </button>
                )}


              </span>
            </div>
          </div>

        </div>
      </div>
    </div >
  );
}


function Header() {
  return (
    <div>
      <header className="header">
        <div className="grid-container headerDivI">
          <div className="grid-x grid-margin-x align-center-middle" id="grdX">
            <div className="cell small-2 medium-2 large-2">
              <a href="index.html">
                <img src={logoTr} id="headLogo" alt="Lexa's logo" />
              </a>
            </div>
            <div className="cell small-4 medium-4 large-4 chat-header">
              <span>LEXA</span>
            </div>
            <div className="cell small-1 medium-1 large-1 setDiv text-center">
              <Menu />
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}

function AppContent() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const location = useLocation(); // ✅ Now safe to use here

  // Pages where the header should NOT appear
  const hideHeaderRoutes = ["/login", "/signup", "/profile-setup"];
  const shouldShowHeader = !hideHeaderRoutes.includes(location.pathname);

  return (
    <>
      {shouldShowHeader && <Header />}

      <main className="grid-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile-setup" element={<ProfileSetup />} />
        </Routes>

        <div
          id="profileReveal"
          className={`reveal ${isProfileOpen ? "active-reveal" : ""}`}
          data-reveal
        >
          <button
            className="close-button"
            aria-label="Close"
            type="button"
            id="closeProfile"
            onClick={() => setIsProfileOpen(false)}
          >
            &times;
          </button>

          <div className="profile-container text-center">
            <img
              id="userAvatar"
              src="assets/imgs/default-avatar.png"
              alt="User Avatar"
              className="profile-avatar"
            />
            <h3 id="userName" className="profile-name">User</h3>
            <p id="userEmail" className="profile-email">user@example.com</p>

            <div className="profile-actions">
              <button id="clearChatBtn" className="button alert expanded">
                🗑 Clear Chat History
              </button>
              <button id="logoutBtn" className="button secondary expanded">
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;

