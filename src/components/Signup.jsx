import React, { useState } from 'react';
import { supabase } from './../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import './../assets/css/signIn.css';
import lexaLogo from './../assets/images/lexa_logo.png';
import { TailChase } from 'ldrs/react';
import 'ldrs/react/TailChase.css';
import { showInfo } from '../assets/js/chat2';


const Signup = () => {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loadingEmail, setLoadingEmail] = useState(false);
    const [loadingGoogle, setLoadingGoogle] = useState(false);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    document.title = "Sign up";

    const handleSignup = async (e) => {
        e.preventDefault()
        setLoadingEmail(true)
        setMessage('')

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    display_name: name // <-- store the name here
                }
            }
        })

        setLoadingEmail(false)

        if (error) {
            if (error.message.includes("Failed to fetch")) {
                setMessage("Something went wrong!")
            }
        } else {
            setMessage('✅ Signup successful! Please check your email to confirm your account.')
            showInfo('Signup successful! Check your email to confirm your account.')
            navigate('/login')
        }
    }

    const handleGoogleSignIn = async () => {
        setLoadingGoogle(true)
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin, // redirect back to your app
            },
        })

        if (error) {
            setMessage(`Google Sign-in failed: ${error.message}`)
        } else {
            console.log('Redirecting to Google...')
        }
    }

    return (
        <div>
            <header className="profile-setup-header">
                <div className="grid-container">
                    <div className="grid-x align-center-middle text-center">
                        <div className="cell">
                            <img src={lexaLogo} alt="Lexa's logo" id="pSlexa-logo" />
                            <span id="profile-setupHeaderName">Ohio Lexa</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className='grid-container'>
                <div className="grid-x align-center-middle">
                    <div className="cell text-center">
                        <h1>Sign Up</h1>
                    </div>
                    <div className='login-container'>

                        <form onSubmit={handleSignup}>
                            <div style={styles.formGroup}>
                                <label htmlFor="name">Name:</label>
                                <input
                                    type="text"
                                    id="nameText"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    style={styles.input}
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label htmlFor="email">Email:</label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    style={styles.input}
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label htmlFor="password">Password:</label>
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    style={styles.input}
                                />
                            </div>
                            {message && (
                                <p style={{ color: message.includes('wrong') ? 'red' : 'green' }}>
                                    {message}
                                </p>
                            )}
                            <div className="cell text-center">
                                <button
                                    className="loginBtn"
                                    title="sign up"
                                    aria-label="sign up"
                                    type="submit"
                                    disabled={loadingEmail || loadingGoogle}
                                    style={styles.signupButton}
                                >
                                    {loadingEmail ? <TailChase
                                        size="30"
                                        speed="2"
                                        color="white"
                                    /> : 'Sign Up'}
                                </button>
                            </div>
                        </form>

                        <hr />
                        <div className="cell text-center">
                            <button
                                className="google-btn"
                                title="sign up"
                                aria-label="sign up"
                                onClick={handleGoogleSignIn}
                                disabled={loadingGoogle || loadingEmail}
                                style={styles.googleButton}
                            >
                                {loadingGoogle ? (
                                    <TailChase size="30" speed="2" color="green" />
                                ) : (
                                    <>
                                        <img
                                            className="google-logo"
                                            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                                            alt="Google logo"
                                        />
                                        Sign up with Google
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="cell text-center">
                            <p style={styles.loginText}>
                                Already have an account?{' '}
                                <Link to="/login" style={styles.loginLink}>
                                    Log in
                                </Link>
                            </p>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}

const styles = {
    container: {
        maxWidth: '400px',
        margin: '0 auto',
        padding: '20px',
        textAlign: 'center',
    },
    formGroup: {
        marginBottom: '10px',
        textAlign: 'left',
    },

    loginText: {
        marginTop: '15px',
    },
    loginLink: {
        color: '#00ff15ff',
        textDecoration: 'none',
        fontWeight: 'bold',
    },
}

export default Signup
