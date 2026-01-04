// =========================
// MODAL LOGIC
// =========================

// Grab modal elements
const modal = document.getElementById("modalOverlay");
const closeBtn = document.getElementById("closeModal");
const navSearchBtn = document.getElementById("openSearch");       // Navbar button
const resultSearchBtn = document.getElementById("resultSearchBtn"); // Result page button

// Open modal
const openModal = (e) => {
  if (e) e.preventDefault();

  const isIndexPage = document.body.dataset.page === "index";

  if (isIndexPage) {
    const searchBox = document.querySelector(".index-search-box");
    if (!searchBox) return;

    searchBox.scrollIntoView({ behavior: "smooth", block: "center" });

    searchBox.classList.remove("index-search-active");
    void searchBox.offsetWidth; // force reflow
    searchBox.classList.add("index-search-active");

    return; // ⛔ DO NOT open modal on index
  }

  // ✅ ALL OTHER PAGES
  if (modal) modal.classList.add("is-open");
};



// Open from navbar
if (navSearchBtn) {
  navSearchBtn.addEventListener("click", openModal);
}

// Open from result page
if (resultSearchBtn) {
  resultSearchBtn.addEventListener("click", openModal);
}

// Close via close button
if (closeBtn) {
  closeBtn.addEventListener("click", () => {
    modal.classList.remove("is-open");
  });
}

// Close when clicking outside modal box
if (modal) {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("is-open");
    }
  });
}


// =========================
// SEARCH FORM TOGGLE LOGIC
// =========================

const btnUpload = document.getElementById("btn-upload");
const btnUrl = document.getElementById("btn-url");
const formUpload = document.getElementById("form-upload");
const formUrl = document.getElementById("form-url");
const fileInput = document.getElementById("fileInput");
const fileNameDisplay = document.getElementById("fileName");

// Toggle Upload / URL forms
if (btnUpload && btnUrl && formUpload && formUrl) {
  btnUpload.addEventListener("click", () => {
    formUpload.classList.remove("hidden");
    formUrl.classList.add("hidden");

    btnUpload.style.background = "var(--primary)";
    btnUrl.style.background = "transparent";
  });

  btnUrl.addEventListener("click", () => {
    formUpload.classList.add("hidden");
    formUrl.classList.remove("hidden");

    btnUrl.style.background = "var(--primary)";
    btnUpload.style.background = "transparent";
  });
}

// Show selected file name
if (fileInput && fileNameDisplay) {
  fileInput.addEventListener("change", () => {
    if (fileInput.files.length > 0) {
      fileNameDisplay.innerText = fileInput.files[0].name;
      fileNameDisplay.style.display = "block";
      fileNameDisplay.style.marginTop = "10px";
    } else {
      fileNameDisplay.innerText = "";
      fileNameDisplay.style.display = "none";
      fileNameDisplay.style.marginTop = "0";
    }
  });
}
