/**
 * Terms of Service component for Lexa, displaying usage policies and user responsibilities.
 */
import Footer from './Footer';
function Terms() {
    document.title = "Terms of Service";
    return (
        <div className="tos-content main">
            <section>
                <h2>1. Introduction</h2>
                <p>
                    Welcome to <strong>Lexa</strong>, an AI chatbot developed by <strong>Ohio Codespace</strong>.
                    By accessing or using Lexa, you agree to these Terms of Service. Please read them carefully before continuing.
                </p>
            </section>

            <section>
                <h2>2. Features & Limitations</h2>
                <p>Lexa provides the following features:</p>
                <ul>
                    <li>Send text, voice, and image prompts to the AI.</li>
                    <li>Use the microphone for voice input with your permission.</li>
                    <li>Store and view your chat history locally or securely in your account if signed in.</li>
                    <li>Copy or listen to Lexa’s responses aloud.</li>
                    <li>Powered by the <strong>Gemini 2.0 Flash</strong> AI model for responses.</li>
                </ul>
                <p>
                    <strong>Limitations:</strong> AI-generated responses may not always be accurate or appropriate. Image generation
                    is not currently supported. You are responsible for how you use the responses.
                </p>
            </section>

            <section>
                <h2>3. Privacy & Data Use</h2>
                <p>
                    Your privacy is a priority. Lexa is designed to protect your information:
                </p>
                <ul>
                    <li>Chat history is stored securely on your device by default.</li>
                    <li>If you sign in, your chats may also be synced to the cloud for backup and multi-device access.</li>
                    <li>Images and voice inputs are used only to generate responses — they are never permanently stored.</li>
                    <li>No personal data is sold or shared with third parties.</li>
                </ul>
            </section>

            <section>
                <h2>4. User Responsibilities</h2>
                <p>
                    By using Lexa, you agree not to:
                </p>
                <ul>
                    <li>Use Lexa for illegal, harmful, or deceptive activities.</li>
                    <li>Upload, send, or prompt explicit, violent, or offensive material.</li>
                    <li>Attempt to manipulate, reverse-engineer, or misuse Lexa’s systems.</li>
                    <li>Violate the privacy or rights of others while using Lexa.</li>
                </ul>
            </section>

            <section>
                <h2>5. Liability Disclaimer</h2>
                <p>
                    Lexa is provided “as is,” without warranties or guarantees of any kind.
                    <strong>Ohio Codespace</strong> is not responsible for damages, inaccuracies, or losses that occur from using
                    Lexa.
                    Always verify critical information independently before relying on AI responses.
                </p>
            </section>

            <section>
                <h2>6. Updates & Modifications</h2>
                <p>
                    These Terms of Service may be updated from time to time to reflect new features or improvements, such as chat
                    storage or performance updates.
                    Continued use of Lexa after updates means you accept the revised terms.
                </p>
            </section>

            <section>
                <h2>7. Contact</h2>
                <p>
                    For questions or concerns about these Terms, contact <strong>Ohio Codespace</strong>.
                </p>
            </section>
            <Footer />
        </div>
    );
}

export default Terms;