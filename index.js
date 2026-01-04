import express from "express";
import axios from "axios";
import multer from "multer";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";

const app = express();
const port = 3000;

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

const upload = multer({ storage: storage });

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
app.post("/upload", upload.single("animeImage"), async (req, res) => {
  try {
    if (!req.file) {
      return res.send("No file uploaded");
    }
    const imageBuffer = fs.readFileSync(req.file.path);

    const response = await axios.post(
      "https://api.trace.moe/search?anilistInfo",
      imageBuffer,
      {
        headers: {
          "Content-Type": "image/jpeg",
        },
      }
    );

    const result = response.data.result[0];
    console.log("Result from trace.moe:", result);

    const uploadedImagePath = `/uploads/${req.file.filename}`;
    console.log("Uploaded Image Path:", uploadedImagePath);

    const animeData = buildAnimeData(result, uploadedImagePath);

    res.render("result.ejs", { anime: animeData });
  } catch (error) {
    console.error(error.message);
    res.send("Error while calling trace.moe");
  }
});
// ---------- UPLOAD & PROCESSING LOGIC [END] ----------

// ---------- URL SUBMISSION LOGIC ----------
app.post("/search-url", async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.send("No image URL provided");
    }

    const response = await axios.get(
      `https://api.trace.moe/search?anilistInfo&url=${encodeURIComponent(
        imageUrl
      )}`
    );

    const result = response.data.result[0];
    console.log("Result from trace.moe:", result);
    console.log("Image URL:", imageUrl);

    const animeData = buildAnimeData(result, imageUrl);

    res.render("result.ejs", { anime: animeData });
  } catch (error) {
    console.error(error.message);
    res.send("Error processing image URL");
  }
});
// ---------- URL SUBMISSION LOGIC [END] ----------

app.get("/about", (req, res) => {
  res.render("about.ejs");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
