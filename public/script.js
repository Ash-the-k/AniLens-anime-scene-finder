const openBtn = document.getElementById("openSearch");
const modal = document.getElementById("modalOverlay");
const closeBtn = document.getElementById("closeModal");

if (openBtn) {
  openBtn.addEventListener("click", () => {
    modal.classList.remove("hidden");
  });
}

if (closeBtn) {
  closeBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
  });
}

modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.classList.add("hidden");
  }
});
