// Menu.jsx
import React, { useState, useRef, useEffect } from 'react';
import {
    BrowserRouter as Router,
    NavLink,
    useNavigate
} from "react-router-dom";
import './../App.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { chatContainer } from '../App';
import { supabase } from '../supabaseClient';
import { Ring } from 'ldrs/react'
import 'ldrs/react/Ring.css';
import { showConfirm, showInfo } from '../assets/js/chat2';
import ohioLogo from './../assets/images/ohio.png';



function Menu() {
    const [isOpen, setIsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isCurrentUser, setIsCurrentUser] = useState(null);
    const yearRef = useRef(null);
    const menuRef = useRef(null);
    const toggleRef = useRef(null);
    const userNameRef = useRef(null);
    const userAvatarRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const yearText = yearRef.current;
        yearText.textContent = new Date().getFullYear();;

    }, []);

    useEffect(() => {
        const fetchSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setIsCurrentUser(session?.user || null);
        };
        fetchSession();
    }, []);

    const toggleMenu = () => setIsOpen((prev) => !prev);
    const closeMenu = () => setIsOpen(false);
    const toggleProfileSec = () => setIsProfileOpen((prev) => !prev);
    const closeProfile = () => setIsProfileOpen(false);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target) &&
                toggleRef.current &&
                !toggleRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    useEffect(() => {
        async function showUserProfile(user) {
            if (!user || !userNameRef.current || !userAvatarRef.current) return;

            const nameSpan = userNameRef.current;
            const avatar = userAvatarRef.current;

            const { data: profile, error } = await supabase
                .from("profiles")
                .select("username, avatar")
                .eq("id", user.id)
                .single();

            if (error && error.code !== "PGRST116") {
                console.error("Error fetching profile:", error.message);
                return;
            }

            if (user.app_metadata?.provider === "google") {
                const { name, picture } = user.user_metadata || {};

                nameSpan.textContent = name || profile?.username || "Google User";
                avatar.src = picture || profile?.avatar || "default-avatar.png";

                await supabase.from("profiles").upsert({
                    id: user.id,
                    username: name || profile?.username || "Google User",
                    avatar: picture || profile?.avatar || null,
                    email: user.email,
                });
            } else {
                if (profile && profile.username) {
                    nameSpan.textContent = profile.username;
                    avatar.src = profile.avatar || "default-avatar.png";
                } else {
                    navigate('/profile-setup');
                }
            }
        }

        // 👇 run only when user + refs exist
        if (isCurrentUser && userNameRef.current && userAvatarRef.current) {
            showUserProfile(isCurrentUser);
        }
    }, [isCurrentUser]);


    return (
        <div>
            <nav className="menu-container" ref={menuRef}>
                <button
                    ref={toggleRef}
                    className="menu-toggle"
                    aria-expanded={isOpen ? 'true' : 'false'}
                    onClick={toggleMenu}
                >
                    <i className={isOpen ? 'fas fa-close' : 'fas fa-bars'}></i>
                </button>

                <div
                    className={`grid-x grid-margin-x align-center-middle text-center menu ${isOpen ? 'show' : ''
                        }`}
                >
                    {isCurrentUser &&
                        <div className="cell lgLnk">
                            <div id="user-profile">
                                <img id="user-avatar" ref={userAvatarRef} alt="Profile" />
                                <span id="user-name" ref={userNameRef}></span>
                            </div>
                        </div>
                    }

                    <ul>
                        <li>
                            <i className="fas fa-house"></i>
                            <NavLink to="/" className={({ isActive }) => (isActive ? 'active' : '')} onClick={closeMenu}>
                                Home
                            </NavLink>
                        </li>
                        {isCurrentUser && (
                            <li className="profile-li">
                                <button
                                    id="openProfile"
                                    onClick={toggleProfileSec}
                                    className="profile-trigger"
                                >
                                    <i className="fas fa-user"></i>
                                    <span>Profile</span>
                                </button>
                            </li>
                        )}
                        <li>
                            <i className="fas fa-info-circle"></i>
                            <NavLink to="/about" className={({ isActive }) => (isActive ? 'active' : '')} onClick={closeMenu}>
                                About
                            </NavLink>
                        </li>
                        <li>
                            <i className="fas fa-scale-balanced"></i>
                            <NavLink to="/terms" className={({ isActive }) => (isActive ? 'active' : '')} onClick={closeMenu}>
                                Terms of Use
                            </NavLink>
                        </li>
                        <li>
                            <i className="fas fa-shield-alt"></i>
                            <NavLink to="/privacy" className={({ isActive }) => (isActive ? 'active' : '')} onClick={closeMenu}>
                                Privacy Policy
                            </NavLink>
                        </li>
                    </ul>

                    {!isCurrentUser && (
                        <div className='cell'>
                            <NavLink to="/login" className="button success" id="homeSigninBtn" title="sign in" onClick={closeMenu}>
                                Sign In
                            </NavLink>
                        </div>
                    )}

                    <div class="cell text-center menuFt">
                        <p>Powered by <strong>Google LLC</strong></p>
                        <a href="https://ohiocodespace.vercel.app" target="_blank" rel="noopener noreferrer">
                            <img src={ohioLogo} alt="ohio Codespace logo" style={{ height: '60px', width: '60px' }} />
                        </a>
                        <p>
                            &copy; <span id="year" ref={yearRef}></span> Ohio Codespace. All rights reserved.
                        </p>
                    </div>

                </div>
            </nav>

            {/* Profile dialog */}
            <ProfileDialog show={isProfileOpen} onClose={closeProfile} />
        </div>
    );
}


function ProfileDialog({ show, onClose }) {
    const [isCurrentUser, setIsCurrentUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [logoutLoading, setLogoutLoading] = useState(false);
    const [clearChatLoading, setClearChatLoading] = useState(false);
    const [chatHistory, setChatHistory] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;
            setIsCurrentUser(user);

            if (!user) {
                setProfile(null);
                setLoading(false);
                return;
            }

            // Fetch profile from Supabase
            const { data: profileData, error } = await supabase
                .from("profiles")
                .select("username, avatar")
                .eq("id", user.id)
                .single();

            if (error && error.code !== "PGRST116") {
                console.error("Error fetching profile:", error.message);
                setLoading(false);
                return;
            }

            // Handle Google login
            if (user.app_metadata?.provider === "google") {
                const { name, picture } = user.user_metadata || {};
                const updatedProfile = {
                    username: name || profileData?.username || "Google User",
                    avatar: picture || profileData?.avatar || "https://i.pravatar.cc/120",
                    email: user.email,
                };

                // Upsert profile to Supabase
                await supabase.from("profiles").upsert({
                    id: user.id,
                    username: updatedProfile.username,
                    avatar: updatedProfile.avatar,
                    email: user.email,
                });

                setProfile(updatedProfile);
            }
            // Email/password users
            else if (profileData?.username) {
                setProfile({
                    ...profileData,
                    email: user.email,
                    avatar: profileData.avatar || "https://i.pravatar.cc/120",
                });
            } else {
                // Redirect if profile not set
                //  window.location.href = "/profile-setup";
            }

            setLoading(false);
            try {
                const { data: chats, error: fetchError } = await supabase
                    .from("chat_history")
                    .select("id")
                    .eq("user_id", user.id);

                if (fetchError) {
                    console.error("Error checking chat history:", fetchError.message);
                    alert("An error occured.");
                    return;
                }

                if (!chats || chats.length === 0) {
                    // No chat found
                    setChatHistory(false);
                } else {
                    // Chat exists
                    setChatHistory(true);
                }
            } catch (err) {
                console.error("Unexpected chat history error:", err);
            }
        };

        if (show) fetchProfile();
    }, [show]);

    const finallyClear = () => {
        showConfirm("You are about to clear the chat history, Proceed?", clearChatHistory)
    }

    const clearChatHistory = async () => {
        if (!isCurrentUser) {
            alert("You must be logged in to clear your chat history.");
            return;
        }

        try {
            setClearChatLoading(true);

            // ✅ Step 1: Check if user has chat history first
            const { data: chats, error: fetchError } = await supabase
                .from("chat_history")
                .select("id")
                .eq("user_id", isCurrentUser.id);

            if (fetchError) {
                console.error("Error checking chat history:", fetchError.message);
                showInfo("Unable to check chat history. Please try again.");
                setClearChatLoading(false);
                return;
            }

            if (!chats || chats.length === 0) {
                //alert();
                showInfo("No chat history found to clear.");
                setClearChatLoading(false);
                return;
            }

            // ✅ Step 2: Proceed to delete if chat exists
            const { error: deleteError } = await supabase
                .from("chat_history")
                .delete()
                .eq("user_id", isCurrentUser.id);

            if (deleteError) {
                console.error("Error clearing chat history:", deleteError.message);
                showInfo("Failed to clear chat history. Please try again.");
                setClearChatLoading(false);
                return;
            }

            // ✅ Step 3: Animate and clear chat container from DOM
            if (chatContainer) {
                chatContainer.classList.add("fade-out");
                setTimeout(() => {
                    chatContainer.innerHTML = "";
                    chatContainer.classList.remove("fade-out");
                }, 400);
            }

            showInfo("Chat history cleared successfully!");
            setClearChatLoading(false);
        } catch (err) {
            console.error("Unexpected error:", err);
            showInfo("Something went wrong. Please try again.");
            setClearChatLoading(false);
        }
    };



    const finallyLogout = () => {
        showConfirm("You are about to logout, Proceed?", logout)
    }
    const logout = async () => {
        setLogoutLoading(true);
        const { error } = await supabase.auth.signOut();
        if (error) {
            alert(error.message);
            setLogoutLoading(false)
        } else window.location.reload();
    };

    if (!show) return null;

    return (
        <div className="profile-overlay" onClick={onClose}>
            <div className="profile-dialog reveal-in" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>
                    <i className="fas fa-times"></i>
                </button>

                <div className="text-center">
                    {loading ? (
                        <Ring
                            size="40"
                            stroke="5"
                            bgOpacity="0"
                            speed="1"
                            color="lime"
                        />
                    ) : (
                        <>
                            <img
                                src={profile?.avatar || "https://i.pravatar.cc/120"}
                                alt="Profile"
                                className="profile-pic"
                            />
                            <h4 className="profile-name">{profile?.username || "Anonymous"}</h4>
                            <p className="profile-email">{profile?.email || "email@example.com"}</p>
                        </>
                    )}
                </div>

                <hr />

                <div className="dialog-actions text-center">
                    <button className="button" id='clrBtn' disabled={!chatHistory || clearChatLoading} onClick={finallyClear}>
                        {clearChatLoading ? (
                            <Ring
                                size="25"
                                stroke="4"
                                bgOpacity="0"
                                speed="2"
                                color="lime"
                            />) : (
                            <>
                                <i class="fas fa-trash"></i>
                                <span> Clear Chat History</span>
                            </>
                        )}


                    </button>
                    <button className="button hollow" disabled={logoutLoading} id='logout-btn' onClick={finallyLogout} style={{ marginLeft: "10px" }}>
                        {logoutLoading ? (
                            <Ring
                                size="25"
                                stroke="4"
                                bgOpacity="0"
                                speed="2"
                                color="lime"
                            />) : (
                            <>
                                <i class="fas fa-power-off"></i>
                                <span> Logout</span>
                            </>
                        )
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Menu;
