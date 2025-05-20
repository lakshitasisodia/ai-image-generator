const themeToggle = document.querySelector(".theme-toggle");
const promptBtn = document.querySelector(".prompt-btn");
const promptInput = document.querySelector(".prompt-input");
const promptForm = document.querySelector(".prompt-form");
const gridGallery = document.querySelector(".gallery-grid");
const modelSelect = document.getElementById("model-select");
const countSelect = document.getElementById("count-select");
const ratioSelect = document.getElementById("ratio-select");

const API_TOKEN = "yourapihere";

const examplePrompts = [
  "A magic forest with glowing plants and fairy homes among giant mushrooms",
  "An old steampunk airship floating through golden clouds at sunset",
  "A futuristic cyberpunk cityscape at night with neon lights and flying cars",
  "A serene Japanese shrine in the middle of a snowy mountain forest",
  "A post-apocalyptic desert wasteland with abandoned robots and rusted vehicles",
  "A dreamy underwater kingdom with glowing jellyfish and coral castles",
  "A giant library floating in space with planets between the bookshelves",
  "A warrior riding a fire-breathing dragon over a burning medieval village",
  "A surreal dreamscape with floating clocks, melting skies, and giant eyes",
  "A peaceful elven village hidden in a lush, foggy forest at dawn",
  "A retro 80s-style Miami beach scene with palm trees and neon lights",
  "An ancient alien temple in the middle of a glowing asteroid field",
  "A cozy witch’s cottage with magical artifacts and a black cat reading a book",
  "A futuristic Mars colony with domed cities and robot farmers",
  "An enchanted garden where flowers whisper secrets and trees glow at night",
  "A noir detective office in a rainy city with vintage decor and shadowy corners",
  "A galaxy-sized whale swimming through stardust and cosmic clouds",
  "A Viking village by a frozen fjord under the northern lights",
  "A haunted Victorian mansion covered in ivy and mist",
  "A giant mech suit standing guard over a peaceful countryside",
  "A painter floating in space, using stars and nebulae as paint",
  "A fairy tale castle built on top of a waterfall with rainbow mist",
  "An astronaut playing guitar on the moon with Earth in the background",
  "A time traveler’s workshop filled with clocks, gears, and glowing portals",
  "A dragon curled around a mountain peak, sleeping under the stars"
];

// Initialize theme on load
(() => {
  const savedTheme = localStorage.getItem("theme");
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDarkTheme = savedTheme === "dark" || (!savedTheme && systemPrefersDark);

  document.body.classList.toggle("dark-theme", isDarkTheme);
  themeToggle.querySelector("i").className = isDarkTheme ? "fa-solid fa-sun" : "fa-solid fa-moon";
})();

// Toggle theme manually
const toggleTheme = () => {
  const isDarkTheme = document.body.classList.toggle("dark-theme");
  localStorage.setItem("theme", isDarkTheme ? "dark" : "light");
  themeToggle.querySelector("i").className = isDarkTheme ? "fa-solid fa-sun" : "fa-solid fa-moon";
};

// Calculate image dimensions based on aspect ratio
const getImageDimension = (aspectRatio, baseSize = 512) => {
  const [width, height] = aspectRatio.split("/").map(Number);
  const scaleFactor = baseSize / Math.sqrt(width * height);

  let calculatedWidth = Math.round(width * scaleFactor);
  let calculatedHeight = Math.round(height * scaleFactor);

  calculatedWidth = Math.floor(calculatedWidth / 16) * 16;
  calculatedHeight = Math.floor(calculatedHeight / 16) * 16;

  return { width: calculatedWidth, height: calculatedHeight };
};

// Update image card with generated image
const updateImageCard = (imgIndex, imgUrl) => {
  const imgCard = document.getElementById(`img-card-${imgIndex}`);
  if (!imgCard) return;

  imgCard.classList.remove("loading");
  imgCard.innerHTML = `
    <img src="${imgUrl}" class="result-img">
    <div class="img-overlay">
      <a href="${imgUrl}" class="img-download-btn" download="${Date.now()}.png">
        <i class="fa-solid fa-download"></i>
      </a>
    </div>
  `;
};

// Generate images using HuggingFace API
const generateImages = async (selectedModel, imageCount, aspectRatio, promptText) => {
  const MODEL_URL = `https://api-inference.huggingface.co/models/${selectedModel}`;
  const { width, height } = getImageDimension(aspectRatio);

  const imagePromises = [...Array(imageCount)].map(async (_, i) => {
    try {
      const response = await fetch(MODEL_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
          "Content-Type": "application/json",
          "x-use-cache": "false",
        },
        body: JSON.stringify({
          inputs: promptText,
          parameters: { width, height },
          options: { wait_for_model: true, use_cache: false },
        }),
      });

      if (!response.ok) {
        throw new Error((await response.json())?.error || "Failed to generate image.");
      }

      const result = await response.blob();
      updateImageCard(i, URL.createObjectURL(result));

    } catch (error) {
     console.error("Error generating image:", error);
      const imgCard = document.getElementById(`img-card-${i}`);
      const statusText = imgCard.querySelector(".status-text");
      statusText.textContent = "Failed to generate";
      imgCard.querySelector(".spinner").style.display = "none";
      imgCard.querySelector(".fa-triangle-exclamation").style.display = "block";
    }
  });

  await Promise.allSettled(imagePromises);
};

// Create loading cards and start generation
const createImageCards = (selectedModel, imageCount, aspectRatio, promptText) => {
  gridGallery.innerHTML = "";
  for (let i = 0; i < imageCount; i++) {
    gridGallery.innerHTML += `
      <div class="img-card loading" id="img-card-${i}" style="aspect-ratio: ${aspectRatio}">
        <div class="status-container">
          <div class="spinner"></div>
          <i class="fa-solid fa-triangle-exclamation"></i>
          <div class="status-text">Generating...</div>
        </div>
      </div>
    `;
  }

  generateImages(selectedModel, imageCount, aspectRatio, promptText);
};

// Handle prompt form submission
const handleFormSubmit = (e) => {
  e.preventDefault();

  const selectedModel = modelSelect.value;
  const imageCount = parseInt(countSelect.value) || 1;
  const aspectRatio = ratioSelect.value || "1/1";
  const promptText = promptInput.value.trim();

  if (!promptText) {
    alert("Please enter a prompt.");
    return;
  }

  createImageCards(selectedModel, imageCount, aspectRatio, promptText);
};

// Random prompt button
promptBtn.addEventListener("click", () => {
  const prompt = examplePrompts[Math.floor(Math.random() * examplePrompts.length)];
  promptInput.value = prompt;
  promptInput.focus();
});

// Attach event listeners
promptForm.addEventListener("submit", handleFormSubmit);
themeToggle.addEventListener("click", toggleTheme);
