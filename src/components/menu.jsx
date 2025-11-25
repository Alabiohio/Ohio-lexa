// Menu.jsx
import React, { useState, useRef, useEffect } from 'react';
import { NavLink } from "react-router-dom";
import './../App.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { chatContainer } from '../App';
import { supabase } from '../supabaseClient';
import { Ring } from 'ldrs/react'
import 'ldrs/react/Ring.css';
import { showConfirm, showInfo } from '../assets/js/chat2';
import ohioLogo from './../assets/images/ohiolg2.png';
import defaultAvatar from './../assets/images/default-avatar.png'
import { fetchUserProfile } from '../assets/js/fetch';



function Menu() {
    const [isOpen, setIsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [userName, setUserName] = useState();
    const [userAvatar, setUserAvatar] = useState();
    const yearRef = useRef(null);
    const menuRef = useRef(null);
    const toggleRef = useRef(null);
    const userNameRef = useRef(null);
    const userAvatarRef = useRef(null);

    useEffect(() => {
        const yearText = yearRef.current;
        yearText.textContent = new Date().getFullYear();;

    }, []);

    const originalTitle = useRef(document.title);

    const toggleMenu = () => setIsOpen((prev) => !prev);
    const closeMenu = () => setIsOpen(false);
    const toggleProfileSec = () => setIsProfileOpen((prev) => !prev);

    useEffect(() => {
        if (isProfileOpen) {
            // Save the current page title only the FIRST time the profile opens
            if (!originalTitle.current) {
                originalTitle.current = document.title;
            }
            document.title = "Profile";
        } else {
            // Restore original page title
            if (originalTitle.current) {
                document.title = originalTitle.current;
                originalTitle.current = null; // Reset for next time
            }
        }
    }, [isProfileOpen]);



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
        async function loadProfile() {
            const result = await fetchUserProfile();

            if (result?.username) {
                setUserName(result.username);
                setUserAvatar(result.avatar);
            }
        }

        loadProfile();

    }, []);

    useEffect(() => {
        const nameSpan = userNameRef.current;
        const avatar = userAvatarRef.current;
        if (!nameSpan || !avatar) return;

        const displayName = userName;
        const avatarUrl = userAvatar;



        nameSpan.textContent = displayName;
        avatar.src = avatarUrl;


    }, [userAvatar, userName]);

    return (
        <div>
            <nav className="menu-container" ref={menuRef}>
                <button
                    ref={toggleRef}
                    className="menu-toggle"
                    aria-expanded={isOpen ? 'true' : 'false'}
                    onClick={toggleMenu}
                    title='Menu'
                    aria-label='Menu'
                >
                    <i className={isOpen ? 'fas fa-close' : 'fas fa-bars'}></i>
                </button>

                <div
                    className={`grid-x grid-margin-x align-center-middle text-center menu ${isOpen ? 'show' : ''
                        }`}
                >
                    {userAvatar &&
                        <div className="cell lgLnk">
                            <div id="user-profile">
                                <img id="user-avatar" src={defaultAvatar} ref={userAvatarRef} alt="Profile" />
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
                        {userAvatar && (
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

                    {!userAvatar && (
                        <div className='cell'>
                            <NavLink to="/login" className="button success" id="homeSigninBtn" title="sign in" onClick={closeMenu}>
                                Sign In
                            </NavLink>
                        </div>
                    )}

                    <div class="cell text-center menuFt">
                        <p>Powered by <strong>Google LLC</strong></p>
                        <a href="https://ohiocodespace.vercel.app" target="_blank" rel="noopener noreferrer">
                            <img src={ohioLogo} alt="ohio Codespace logo" style={{ height: '50px', width: '50px' }} />
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
    const [isEditing, setIsEditing] = useState(false);
    const [newUsername, setNewUsername] = useState("");
    const [newAvatar, setNewAvatar] = useState(null);
    const [saving, setSaving] = useState(false);


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

            // --- Get data *only from auth* ---
            const metadata = user.user_metadata || {};

            const displayName =
                metadata.display_name ||   // email/password signup name
                metadata.name ||           // google oauth name
                "User";

            const avatarUrl =
                metadata.avatar_url ||     // if you store one later
                metadata.picture ||        // google photo
                defaultAvatar;             // fallback

            const finalProfile = {
                username: displayName,
                avatar: avatarUrl,
                email: user.email,
            };

            setProfile(finalProfile);
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


    const updateProfile = async () => {
        if (!isCurrentUser) return;
        setSaving(true);

        try {
            let avatarUrl = profile.avatar;

            // 1) Upload new avatar if selected
            if (newAvatar) {
                const ext = newAvatar.name.split('.').pop();
                // Use unique filename to avoid caching & collisions
                const fileName = `${isCurrentUser.id}_${Date.now()}.${ext}`;

                const { error: uploadErr } = await supabase.storage
                    .from('avatars')
                    .upload(fileName, newAvatar, { upsert: false }); // upsert: false because we use unique name

                if (uploadErr) {
                    console.error('Upload error:', uploadErr.message);
                    showInfo('Failed to upload image');
                    setSaving(false);
                    return;
                }

                // 2) Get public URL (public bucket) OR create signed URL (private bucket)
                const { data: publicData, error: publicErr } = await supabase.storage
                    .from('avatars')
                    .getPublicUrl(fileName);

                if (publicErr) {
                    console.warn('getPublicUrl error (falling back to signed url):', publicErr.message);
                }

                // publicUrl will be defined only if bucket is public
                if (publicData?.publicUrl) {
                    avatarUrl = publicData.publicUrl;
                } else {
                    // If the bucket is private, create a signed URL valid for, say, 1 hour (3600s)
                    const { data: signedData, error: signedErr } = await supabase.storage
                        .from('avatars')
                        .createSignedUrl(fileName, 60 * 60);

                    if (signedErr) {
                        console.error('Signed URL error:', signedErr.message);
                        showInfo('Failed to get avatar URL');
                        setSaving(false);
                        return;
                    }
                    avatarUrl = signedData.signedUrl;
                }
            }

            // 3) Update auth user metadata (display_name + avatar_url)
            const { error: authErr } = await supabase.auth.updateUser({
                data: {
                    display_name: newUsername || profile.username, // keep existing if newUsername empty
                    avatar_url: avatarUrl,
                },
            });

            if (authErr) {
                console.error('Auth update error:', authErr.message);
                showInfo('Failed to update profile');
                setSaving(false);
                return;
            }

            // 4) Refresh session / get latest user to ensure client sees updated metadata
            // Re-fetch session/user
            const { data: sessionData } = await supabase.auth.getSession();
            const updatedUser = sessionData?.session?.user || sessionData?.user || null;

            // 5) Update local UI state with the new info
            setProfile((prev) => ({
                ...prev,
                username: (newUsername && newUsername.trim()) || prev.username,
                avatar: avatarUrl,
                email: updatedUser?.email || prev.email,
            }));

            setIsEditing(false);
            showInfo('Profile updated!');
        } catch (err) {
            console.error('Unexpected error updating profile:', err);
            showInfo('Something went wrong. Please try again.');
        } finally {
            setSaving(false);
        }
    };


    return (
        <div className="profile-overlay" onClick={onClose}>
            <div className="profile-dialog reveal-in" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>
                    <i className="fas fa-times"></i>
                </button>


                <div className='edits'>
                    <div className='editCtrlBox'>
                        <button
                            className={isEditing ? 'notEditBtn' : 'editBtn'}
                            onClick={() => {
                                setIsEditing(!isEditing);
                                setNewUsername(profile?.username);
                            }}
                            style={{ marginBottom: "10px" }}
                        >
                            {isEditing ? (
                                <>
                                    <i className='fas fa-times'></i>
                                    Cancel
                                </>
                            ) : (
                                <>
                                    <i className='fas fa-edit'></i>
                                    Edit
                                </>
                            )

                            }
                        </button>
                    </div>

                    {isEditing && (
                        <div className='editingBox'>
                            <button
                                className="saveBtn"
                                disabled={saving}
                                onClick={updateProfile}
                            >
                                {saving ? "Saving..." :
                                    (
                                        <>
                                            <i className='fas fa-check'></i>
                                            Save changes
                                        </>
                                    )
                                }
                            </button>
                        </div>
                    )}
                </div>




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
                            {isEditing ? (
                                <>
                                    {/* Avatar Upload */}
                                    <div className="avatar-wrapper">
                                        <img
                                            src={newAvatar ? URL.createObjectURL(newAvatar) : profile?.avatar}
                                            alt="Profile"
                                            className="profile-pic"
                                        />

                                        <label className="avatar-overlay">
                                            <i className="fas fa-edit"></i>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => setNewAvatar(e.target.files[0])}
                                                style={{ display: "none" }}
                                            />
                                        </label>
                                    </div>


                                    {/* Username Input */}
                                    <input
                                        type="text"
                                        className="edit-username-input"
                                        placeholder="Enter username"
                                        value={newUsername}
                                        onChange={(e) => setNewUsername(e.target.value)}
                                    />
                                </>
                            ) : (
                                <>
                                    <img
                                        src={profile?.avatar || defaultAvatar}
                                        alt="Profile"
                                        className="profile-pic"
                                    />
                                    <h4 className="profile-name">{profile?.username}</h4>
                                </>
                            )}

                            <p className="profile-email">{profile?.email || null}</p>
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
        </div >
    );
}

export default Menu;
