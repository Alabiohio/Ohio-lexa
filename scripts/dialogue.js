
const dialogOverlay = document.getElementById("customDialog");
const dialogMessage = document.getElementById("dialogMessage");
const dialogButtons = document.getElementById("dialogButtons");

// Confirm dialog
function showConfirm(message, onOk, onCancel) {
    dialogMessage.textContent = message;
    dialogButtons.innerHTML = `
      <button class="dialog-button btn-cancel">Cancel</button>
      <button class="dialog-button btn-ok">OK</button>
    `;
    dialogOverlay.style.display = "flex";

    // Button handlers
    dialogButtons.querySelector(".btn-ok").onclick = () => {
        dialogOverlay.style.display = "none";
        if (typeof onOk === "function") onOk();
    };
    dialogButtons.querySelector(".btn-cancel").onclick = () => {
        dialogOverlay.style.display = "none";
        if (typeof onCancel === "function") onCancel();
    };
}

// Info dialog (only OK)
function showInfo(message, onOk) {
    dialogMessage.textContent = message;
    dialogButtons.innerHTML = `
      <button class="dialog-button btn-ok">OK</button>
    `;
    dialogOverlay.style.display = "flex";

    dialogButtons.querySelector(".btn-ok").onclick = () => {
        dialogOverlay.style.display = "none";
        if (typeof onOk === "function") onOk();
    };
}
//showConfirm("Are you sure?", () => alert("Confirmed!"), () => alert("Cancelled"));


