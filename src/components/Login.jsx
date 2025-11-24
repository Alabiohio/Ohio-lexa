import React, { useState, useEffect } from 'react'
import { supabase } from './../supabaseClient'
import { useNavigate, Link } from 'react-router-dom'
import './../assets/css/signIn.css';
import lexaLogo from './../assets/images/lexa_logo.png';
import { TailChase } from 'ldrs/react'
import 'ldrs/react/TailChase.css'



const Login = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loadingEmail, setLoadingEmail] = useState(false);
    const [loadingGoogle, setLoadingGoogle] = useState(false);
    const [message, setMessage] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const navigate = useNavigate()

    // Handle normal email/password login
    const handleLogin = async (e) => {
        e.preventDefault()
        setLoadingEmail(true)
        setMessage('')

        const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password.trim(),
        })

        if (error) {
            if (error.message.includes("Failed to fetch")) {
                setErrorMsg("Something went wrong!");
                setMessage(errorMsg);
            } else {
                setErrorMsg(error.message);
                setMessage(errorMsg);
            }
            setLoadingEmail(false)
            return
        }

        // Fetch user profile to check for username
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', data.user.id)
            .single()

        setLoadingEmail(false)

        if (profileError) {
            alert('Error loading profile. Try again.')
            return
        }

        setMessage('Login successful! Redirecting...')

        setTimeout(() => {
            if (!profile || !profile.username) {
                navigate('/profile-setup')
            } else {
                navigate('/')
            }
        }, 1500)
    }

    // Handle Google OAuth login
    const handleGoogleSignIn = async () => {
        setLoadingGoogle(true)
        setMessage('')
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin,
            },
        })

        if (error) {
            setMessage(`❌ Google login error: ${error.message}`)
        } else {
            console.log('Redirecting to Google...');
        }
    }

    // Check for already logged-in user on mount
    useEffect(() => {
        const checkSession = async () => {
            const { data: sessionData } = await supabase.auth.getSession()
            const user = sessionData?.session?.user
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('username')
                    .eq('id', user.id)
                    .single()

                if (!profile || !profile.username) {
                    navigate('/profile-setup')
                } else {
                    navigate('/')
                }
            }
        }
        checkSession()
    }, [navigate])

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
                        <h1>Sign In to Lexa</h1>
                    </div>
                    <div className='login-container'>



                        {message && (
                            <p style={{ color: message.includes(errorMsg) ? 'red' : 'green' }}>
                                {message}
                            </p>
                        )}


                        <form onSubmit={handleLogin}>
                            <div style={styles.formGroup}>
                                <label>Email:</label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    style={styles.input}
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label>Password:</label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    style={styles.input}
                                />
                            </div>

                            <div className="cell text-center">
                                <button
                                    className="loginBtn"
                                    title="sign up"
                                    aria-label="sign up"
                                    type="submit"
                                    disabled={loadingEmail || loadingGoogle}
                                >
                                    {loadingEmail ? <TailChase
                                        size="30"
                                        speed="2"
                                        color="white"
                                    /> : 'Login'}
                                </button>
                            </div>
                        </form>

                        <hr />
                        <div className="cell text-center">
                            <button
                                className="google-btn"
                                onClick={handleGoogleSignIn}
                                disabled={loadingGoogle || loadingEmail}
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
                                        Sign in with Google
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="cell text-center">
                            <p style={styles.signupText}>
                                Don’t have an account?{' '}
                                <Link to="/signup" style={styles.signupLink}>
                                    Sign up
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div >

    )
}

const styles = {
    formGroup: {
        marginBottom: '10px',
        textAlign: 'left',
    },
    signupText: {
        marginTop: '15px',
    },
    signupLink: {
        color: '#5eff00ff',
        textDecoration: 'none',
        fontWeight: 'bold',
    },
}

export default Login
