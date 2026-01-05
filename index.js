import express from "express";
import axios from "axios";
import multer from "multer";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";

const app = express();
const port = process.env.PORT || 3000;

class AppError extends Error {
  constructor(message, details = "", status = 500) {
    super(message);
    this.details = details;
    this.status = status;
  }
}

app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

// ---------- MULTER SETUP ----------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
// ---------- MULTER SETUP [END] ----------

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image files are allowed"));
    } else {
      cb(null, true);
    }
  },
});

// ---------- CLEANUP LOGIC (TOP LEVEL) ----------
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const MAX_AGE = 1 * 60 * 1000; // 1 minute

function cleanupUploads() {
  fs.readdir(UPLOAD_DIR, (err, files) => {
    if (err) return;

    const now = Date.now();

    files.forEach((file) => {
      const filePath = path.join(UPLOAD_DIR, file);

      fs.stat(filePath, (err, stats) => {
        if (err) return;

        const age = now - stats.mtimeMs;

        if (age > MAX_AGE) {
          fs.unlink(filePath, (err) => {
            if (!err) {
              console.log("Auto-deleted old upload:", file);
            }
          });
        }
      });
    });
  });
}

setInterval(cleanupUploads, 30 * 1000);
// ---------- CLEANUP LOGIC (TOP LEVEL) [END] ----------

// ---------- BUILD ANIME DATA FUNCTION ----------
function buildAnimeData(result, uploadedImage) {
  const animeData = {
    titleRomaji: result.anilist.title.romaji || null,
    titleEnglish: result.anilist.title.english || null,
    titleNative: result.anilist.title.native || null,

    episode: result.episode ?? "N/A",
    similarity: (result.similarity * 100).toFixed(2),
    anilistUrl: result.anilist.siteUrl,

    coverImage:
      result.anilist.coverImage?.large ||
      result.anilist.coverImage?.medium ||
      null,

    bannerImage: result.anilist.bannerImage || null,
    previewImage: result.image,
    video: result.video,

    uploadedImage,
  };

  const similarityValue = Number(animeData.similarity);

  let confidence = "Low Confidence";
  if (similarityValue >= 85) confidence = "High Confidence";
  else if (similarityValue >= 60) confidence = "Medium Confidence";

  animeData.confidence = confidence;

  console.log(
    "Anime:",
    animeData.titleRomaji || animeData.titleEnglish || animeData.titleNative
  );
  console.log("Episode:", animeData.episode);
  console.log("Similarity:", animeData.similarity);

  return animeData;
}
// ---------- BUILD ANIME DATA FUNCTION [END] ----------

// ---------- ROUTES ----------

app.get("/", (req, res) => {
  res.render("index.ejs", { showSearchButton: false });
});

// ---------- UPLOAD & PROCESSING LOGIC ----------
app.post("/upload", upload.single("animeImage"), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError(
        "No image uploaded.",
        "Please select a valid image file.",
        400
      );
    }

    const imageBuffer = fs.readFileSync(req.file.path);

    const response = await axios.post(
      "https://api.trace.moe/search?anilistInfo",
      imageBuffer,
      { headers: { "Content-Type": "image/jpeg" } }
    );

    if (!response.data.result || response.data.result.length === 0) {
      throw new AppError(
        "No matching scene found.",
        "Try a clearer frame without subtitles or heavy edits.",
        404
      );
    }

    const animeData = buildAnimeData(
      response.data.result[0],
      `/uploads/${req.file.filename}`
    );

    res.render("result.ejs", { anime: animeData });
  } catch (err) {
    next(err); // 🔥 THIS is the key
  }
});

// ---------- UPLOAD & PROCESSING LOGIC [END] ----------

// ---------- URL SUBMISSION LOGIC ----------
app.post("/search-url", async (req, res, next) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      throw new AppError(
        "No image URL provided.",
        "Please paste a valid image URL.",
        400
      );
    }

    const response = await axios.get(
      `https://api.trace.moe/search?anilistInfo&url=${encodeURIComponent(
        imageUrl
      )}`
    );

    if (!response.data.result || response.data.result.length === 0) {
      throw new AppError(
        "No matching scene found.",
        "Try a clearer frame without subtitles or heavy edits.",
        404
      );
    }

    const animeData = buildAnimeData(response.data.result[0], imageUrl);
    res.render("result.ejs", { anime: animeData });
  } catch (err) {
    next(err);
  }
});

// ---------- URL SUBMISSION LOGIC [END] ----------

app.get("/about", (req, res) => {
  res.render("about.ejs");
});

app.use((req, res) => {
  res.status(404).render("error.ejs", {
    message: "Page not found.",
    details: "The requested resource does not exist.",
  });
});

/* =========================
   GLOBAL ERROR HANDLER
========================= */

app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);

  let message = "System Interrupt";
  let details = "An unexpected error occurred.";

  // Multer file type error
  if (err.message === "Only image files are allowed") {
    message = "Invalid File Type";
    details = "Please upload a valid image (JPG, PNG, WEBP).";
  }

  // Multer file size error (future-safe)
  if (err.code === "LIMIT_FILE_SIZE") {
    message = "File Too Large";
    details = "Please upload a smaller image.";
  }

  // Axios / trace.moe errors
  if (err.response) {
    message = "Scene Analysis Failed";
    details = "Trace.moe service returned an error.";
  } else if (err.request) {
    message = "Service Unavailable";
    details = "Trace.moe is not responding. Please try again later.";
  }

  res.status(400).render("error.ejs", {
    message,
    details,
  });
});



app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
