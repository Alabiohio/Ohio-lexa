import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import './../assets/css/signIn.css';

const ResetPassword = () => {
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    const handleReset = async (e) => {
        e.preventDefault();

        if (password.length < 6) {
            setMessage("❌ Password must be at least 6 characters");
            return;
        }

        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
            setMessage("❌ " + error.message);
        } else {
            setMessage("✅ Password updated! Redirecting to login...");
            setTimeout(() => navigate("/login"), 1500); // redirect after short delay
        }
    };

    return (
        <div className="grid-container align-center-middle reset">
            <div className="cell">
                <h2>Reset Your Password</h2>
            </div>


            {message && <p>{message}</p>}

            <form onSubmit={handleReset}>
                <label>New Password:</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button className="loginBtn" type="submit">Update Password</button>
            </form>
        </div>
    );
};

export default ResetPassword;
