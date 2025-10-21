export function handleImageSelection(
    event,
    setPendingImage,
    setImagePreview,
    toggleMedOpt,
    setResetInputValue
) {
    toggleMedOpt(); // Calls toggleMedOpt correctly
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        //e.target.result contains the base64
        setPendingImage(e.target.result.split(",")[1]); // Just store base64 data part
        setImagePreview(e.target.result);
        setResetInputValue(false); // Reset after the file has been selected
    };
    reader.readAsDataURL(file);
    event.target.value = "";
    setResetInputValue(true);
}
