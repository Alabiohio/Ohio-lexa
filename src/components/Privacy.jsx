import Footer from './Footer';
const Privacy = () => {

    document.title = "Privacy Policy";

    return (
        <div className="grid-container privacy-section main">
            <div className="grid-x grid-margin-x align-center">
                <div className="cell medium-10 large-8">
                    <p>
                        This Privacy Policy explains how <strong>Lexa</strong> handles your data while you use the chatbot. We value
                        your privacy and are committed to protecting it.
                    </p>

                    <h2>1. Data Collection</h2>
                    <p>
                        - Only the text, images, or voice prompts you choose to send are processed.<br />
                        - Lexa may access your microphone or image files, but only with your explicit permission.<br />
                        - Images are never permanently stored — only the one you select is processed as a prompt.
                    </p>

                    <h2>2. Chat Storage</h2>
                    <p>
                        Starting with this update, Lexa now offers optional <strong>cloud-based chat storage</strong> for users who
                        are signed in. This allows your conversations to sync across devices and be available whenever you log in.
                    </p>
                    <p>
                        - If you are <strong>not signed in</strong>, your chats are stored only on your device and never sent to any
                        server.<br />
                        - If you are <strong>signed in</strong>, your chats may be securely stored in Lexa’s cloud database (powered
                        by <strong>Supabase</strong>) and are linked to your account.<br />
                        - You can <strong>delete</strong> your chat history at any time, either locally or from the cloud.
                    </p>

                    <h2>3. Permissions</h2>
                    <p>
                        - <strong>Microphone:</strong> Required to send voice messages as prompts.<br />
                        - <strong>Image Access:</strong> Required to send images as prompts.<br />
                        - <strong>Storage Access:</strong> Required to locally save and manage your chat history.
                    </p>

                    <h2>4. Data Usage</h2>
                    <p>
                        The prompts you send (text, image, or voice) are processed by the <strong>Gemini 2.0 Flash model</strong> to
                        generate responses. Lexa does not store or analyze your prompts beyond what is necessary to deliver an
                        answer.
                    </p>

                    <h2>5. Security</h2>
                    <p>
                        Lexa is built with privacy in mind. Chat data stored in the cloud is protected using secure
                        authentication and encryption provided by Supabase. Your personal information is never sold, shared, or
                        used for advertising.
                    </p>

                    <h2>6. Your Choices</h2>
                    <p>
                        - You can clear your local chat history at any time from within the app.<br />
                        - You can delete your cloud-stored chats by logging into your account and removing them.<br />
                        - You can revoke permissions such as microphone or image access at any time via your browser or device
                        settings.
                    </p>

                    <h2>7. Updates</h2>
                    <p>
                        This Privacy Policy may be updated occasionally to reflect new features or improvements. You will be
                        notified within the app when significant changes occur.
                    </p>

                    <h2>8. Contact</h2>
                    <p>
                        For questions about this Privacy Policy or data handling, please contact <strong>Ohio Codespace</strong>.
                    </p>
                </div>
            </div>
            <Footer />
        </div>
    );
}


export default Privacy;