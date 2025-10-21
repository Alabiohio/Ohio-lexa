import React, { useState, useEffect } from 'react'
import { supabase } from './../supabaseClient'
import { useNavigate } from 'react-router-dom'
import './../assets/css/signIn.css'
import lexaLogo from './../assets/images/lexa_logo.png'
import { TailChase } from 'ldrs/react'
import 'ldrs/react/TailChase.css'

const ProfileSetup = () => {
    const [username, setUsername] = useState('')
    const [dob, setDob] = useState('')
    const [avatarFile, setAvatarFile] = useState(null)
    const [avatarPreview, setAvatarPreview] = useState(null)
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)

    const navigate = useNavigate()

    // Load current user on mount
    const [user, setUser] = useState(null)
    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user }, error } = await supabase.auth.getUser()
            if (error || !user) {
                setMessage('Please log in first.')
                return
            }
            setUser(user)
        }
        fetchUser()
    }, [])

    // Handle avatar preview
    const handleAvatarChange = (e) => {
        const file = e.target.files[0]
        setAvatarFile(file)
        if (file) {
            const reader = new FileReader()
            reader.onload = (e) => setAvatarPreview(e.target.result)
            reader.readAsDataURL(file)
        } else {
            setAvatarPreview(null)
        }
    }

    // Handle profile form submission
    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!username.trim()) {
            setMessage('Username is required.')
            return
        }
        if (!user) {
            setMessage('Please log in first.')
            return
        }

        setLoading(true)
        setMessage('')

        let avatarUrl = null
        if (avatarFile) {
            const fileExt = avatarFile.name.split('.').pop()
            const filePath = `${user.id}/avatar.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, avatarFile, { upsert: true })

            if (uploadError) {
                setMessage('Avatar upload failed.')
                setLoading(false)
                return
            }

            const { data: publicURL } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            avatarUrl = publicURL.publicUrl
        }

        // Save profile data
        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: user.id,
                username,
                dob: dob || null,
                avatar: avatarUrl || null,
                email: user.email,
            })

        setLoading(false)

        if (error) {
            setMessage(error.message)
        } else {
            setMessage('Profile saved successfully! Redirecting...')
            setTimeout(() => navigate('/'), 1500)
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
                        <h1>Set Up Your Profile</h1>
                    </div>
                    <div className='cell'>

                        {message && (
                            <p style={{ color: message.includes('failed') || message.includes('required') ? 'red' : 'green' }}>
                                {message}
                            </p>
                        )}

                        <form onSubmit={handleSubmit} style={styles.form}>
                            <div style={styles.formGroup}>
                                <label>Username:</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    style={styles.input}
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label>Date of Birth:</label>
                                <input
                                    type="date"
                                    value={dob}
                                    onChange={(e) => setDob(e.target.value)}
                                    style={styles.input}
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label>Avatar:</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    style={styles.input}
                                />
                                {avatarPreview && (
                                    <img
                                        src={avatarPreview}
                                        alt="Avatar Preview"
                                        style={styles.avatarPreview}
                                    />
                                )}
                            </div>

                            <div className="cell text-center">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    id='saveProfile'
                                >
                                    {loading ? <TailChase
                                        size="30"
                                        speed="2"
                                        color="white"
                                    /> : 'Save Profile'}
                                </button>
                            </div>
                        </form>
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
    form: {
        textAlign: 'left',
    },
    formGroup: {
        marginBottom: '10px',
    },
    avatarPreview: {
        display: 'block',
        width: '100px',
        height: '100px',
        objectFit: 'cover',
        marginTop: '10px',
        borderRadius: '50%',
    },
}

export default ProfileSetup
