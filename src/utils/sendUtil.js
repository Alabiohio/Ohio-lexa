// sendMessageUtils.js

export async function sendMessage(
    pendingImage,
    appendMessage,      // Pass appendMessage function
    showTyping,        // Pass showTyping function
    removeTyping,      // Pass removeTyping function
    conversationHistory, // Pass conversation history reference
    saveChatHistory,   // Pass saveChatHistory function
    trimHistory,       // Pass trimHistory function
    setPendingImage,   // Pass setPendingImage function
    API_URL,            // Api URL
    userInputRef,  //Text area reference
) {
    //Removed global variable
    const inputField = userInputRef.current; //Now the input field is using ref.
    const input = inputField.value.trim(); //Access to user input.
    if (!input && !pendingImage) return;

    //Remove global preview
    const imagePreview = document.querySelector(".image-preview"); //Or change for ref.
    if (imagePreview) {
        imagePreview.remove();
    }

    let userMsg = input || "";
    if (pendingImage) {
        userMsg += `<br><img src="data:image/png;base64,${pendingImage}" class="preview">`;
    }
    appendMessage("user", userMsg); //Call the functions

    inputField.value = ""; //Clear the input value again (redundant)
    const typingId = showTyping();  //Display typing...

    try {
        // ✅ Add new user message to history
        let userParts = [];

        if (input) {
            userParts.push({ text: input });
        } else if (pendingImage) {
            userParts.push({ text: "Describe this image in detail." });
        }
        if (pendingImage) {
            userParts.push({
                inline_data: { mime_type: "image/png", data: pendingImage },
            });
        }

        conversationHistory.push({ role: "user", parts: userParts }); //Assign all in the history.
        trimHistory();

        // ✅ Send *full history* not just latest
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: conversationHistory }),
        });

        const data = await response.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "⚠️ Error!";

        // ✅ Add bot reply to history
        conversationHistory.push({ role: "model", parts: [{ text: reply }] });
        trimHistory();

        removeTyping(typingId);
        appendMessage("bot", reply, true);

        // ✅ Save history for reload
        saveChatHistory();
    } catch (error) {
        removeTyping(typingId);
        appendMessage("bot", "⚠️ Network error!");
    } finally {
        setPendingImage(null);  //Clean the value
    }
}
