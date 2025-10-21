import { useState, useRef } from "react";

export function useSpeechRecognition(sendVMessage) {
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef(null);

    function createSpeechRecognizer({ onResult, onError, onEnd }) {
        const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert("Speech recognition not supported in this browser.");
            return null;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onresult = onResult;
        recognition.onerror = onError;
        recognition.onend = onEnd;

        return recognition;
    }

    function startRecording() {
        const recognition = createSpeechRecognizer({
            onResult: (event) => {
                const transcript = event.results[0][0].transcript.trim();
                setIsRecording(false);
                sendVMessage(transcript);
            },
            onError: (err) => {
                console.error("Speech recognition error:", err);
                setIsRecording(false);
            },
            onEnd: () => setIsRecording(false),
        });

        if (!recognition) return;

        recognitionRef.current = recognition;
        setIsRecording(true);
        recognition.start();
    }

    function stopRecording() {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsRecording(false);
        }
    }

    return {
        isRecording,
        startRecording,
        stopRecording,
    };
}
