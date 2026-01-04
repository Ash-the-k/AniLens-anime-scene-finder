/* =========================
   SEARCH MODAL LOGIC
========================= */

// Elements
const modal = document.getElementById("modalOverlay");
const closeModalBtn = document.getElementById("closeModal");
const navSearchBtn = document.getElementById("openSearch");
const resultSearchBtn = document.getElementById("resultSearchBtn");

/* ---------- Helpers ---------- */

function isIndexPage() {
  return document.body.dataset.page === "index";
}

function triggerIndexSearchGlow() {
  const searchBox = document.querySelector(".index-search-box");
  if (!searchBox) return;

  searchBox.scrollIntoView({ behavior: "smooth", block: "center" });

  // retrigger glow animation
  searchBox.classList.remove("index-search-active");
  void searchBox.offsetWidth; // force reflow
  searchBox.classList.add("index-search-active");
}

function openModal() {
  if (modal) modal.classList.add("is-open");
}

function closeModal() {
  if (modal) modal.classList.remove("is-open");
}

/* ---------- Open Search ---------- */

function handleSearchOpen(e) {
  if (e) e.preventDefault();

  // Index page → glow search box
  if (isIndexPage()) {
    triggerIndexSearchGlow();
    return;
  }

  // Other pages → modal
  openModal();
}

// Navbar search
if (navSearchBtn) {
  navSearchBtn.addEventListener("click", handleSearchOpen);
}

// Result page search
if (resultSearchBtn) {
  resultSearchBtn.addEventListener("click", handleSearchOpen);
}

/* ---------- Close Modal ---------- */

// Close via X
if (closeModalBtn) {
  closeModalBtn.addEventListener("click", closeModal);
}

// Close by clicking overlay
if (modal) {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
}

/* =========================
   SEARCH FORM TOGGLE
========================= */

const btnUpload = document.getElementById("btn-upload");
const btnUrl = document.getElementById("btn-url");
const formUpload = document.getElementById("form-upload");
const formUrl = document.getElementById("form-url");

function activateUploadMode() {
  formUpload.classList.remove("hidden");
  formUrl.classList.add("hidden");

  btnUpload.style.background = "var(--primary)";
  btnUrl.style.background = "transparent";
}

function activateUrlMode() {
  formUpload.classList.add("hidden");
  formUrl.classList.remove("hidden");

  btnUrl.style.background = "var(--primary)";
  btnUpload.style.background = "transparent";
}

if (btnUpload && btnUrl && formUpload && formUrl) {
  btnUpload.addEventListener("click", activateUploadMode);
  btnUrl.addEventListener("click", activateUrlMode);
}

/* =========================
   FILE NAME DISPLAY
========================= */

const fileInput = document.getElementById("fileInput");
const fileNameDisplay = document.getElementById("fileName");

function updateFileName() {
  if (!fileInput.files.length) {
    fileNameDisplay.textContent = "";
    fileNameDisplay.style.display = "none";
    fileNameDisplay.style.marginTop = "0";
    return;
  }

  fileNameDisplay.textContent = fileInput.files[0].name;
  fileNameDisplay.style.display = "block";
  fileNameDisplay.style.marginTop = "10px";
}

if (fileInput && fileNameDisplay) {
  fileInput.addEventListener("change", updateFileName);
}
