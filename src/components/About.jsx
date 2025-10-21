import logoTr from './../assets/images/logo-tr.png';
import Footer from './Footer';

function About() {

    return (
        <div className='main'>
            <section id="about-lexa" className="grid-container fluid">
                <div className="grid-x grid-margin-x align-center">

                    <div className="cell small-12 medium-6">
                        <div className="cell lgHII">
                            <img src={logoTr} style={{ height: '35px', width: '35px', borderRadius: '20px' }} alt="lexa logo" />
                            <h2>Meet <span>Lexa</span></h2>
                        </div>

                        <p>
                            <strong>Lexa</strong> is an AI-powered chatbot created by <strong>Ohio Codespace</strong>.
                            Designed to assist, chat, and simplify tasks, Lexa combines speed, intelligence,
                            and a natural user experience in one clean interface.
                        </p>

                        <p>
                            Built on <strong>Google’s Gemini 2.0 Flash</strong>, Lexa delivers instant and reliable responses.
                            Whether you type, speak, or send images, Lexa adapts to your way of communicating.
                        </p>

                        <p>
                            With the latest update, Lexa now includes <strong>local and secure chat storage</strong> —
                            your chats are saved on your device for convenience and can be cleared anytime.
                            If you sign in, chats can also sync safely across your devices.
                        </p>

                        <p>
                            Privacy remains central to Lexa’s design. Your prompts, voice, and image inputs are only used
                            to generate responses and are never stored or shared externally.
                        </p>
                    </div>

                    <div className="cell small-12 medium-6">
                        <div className="callout radius">
                            <h4>✨ Key Features</h4>
                            <ul>
                                <li>Send Images as Prompts</li>
                                <li>Use Voice Messages as Prompts</li>
                                <li>Copy & Read Aloud Responses</li>
                                <li>Chat Storage — Local or Synced with Account</li>
                                <li>Privacy-First Design</li>
                                <li>Powered by Gemini 2.0 Flash</li>
                                <li>Image Generation not supported (yet)</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>
            <Footer />
        </div>
    );
}

export default About;