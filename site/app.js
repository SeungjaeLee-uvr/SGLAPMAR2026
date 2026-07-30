const slides = Array.from(document.querySelectorAll(".slide"));
const rail = document.getElementById("slideRail");
const counter = document.getElementById("slideCounter");
const progressBar = document.getElementById("progressBar");
const prevButton = document.getElementById("prevButton");
const nextButton = document.getElementById("nextButton");
const notesButton = document.getElementById("notesButton");
const notesDrawer = document.getElementById("notesDrawer");
const notesTitle = document.getElementById("notesTitle");
const notesContent = document.getElementById("notesContent");
const closeNotesButton = document.getElementById("closeNotesButton");
const overviewButton = document.getElementById("overviewButton");
const overviewDialog = document.getElementById("overviewDialog");
const closeOverviewButton = document.getElementById("closeOverviewButton");
const overviewGrid = document.getElementById("overviewGrid");
const imageDialog = document.getElementById("imageDialog");
const zoomedImage = document.getElementById("zoomedImage");
const closeImageButton = document.getElementById("closeImageButton");

let currentIndex = 0;
let touchStartX = 0;

function twoDigits(value) {
  return String(value).padStart(2, "0");
}

function updateNotes() {
  const slide = slides[currentIndex];
  const source = slide.querySelector(".speaker-notes");
  notesTitle.textContent = slide.dataset.title;
  notesContent.innerHTML = source ? source.innerHTML : "<p>No notes for this slide.</p>";
}

function setSlide(index, options = {}) {
  currentIndex = Math.max(0, Math.min(slides.length - 1, index));

  slides.forEach((slide, slideIndex) => {
    const isActive = slideIndex === currentIndex;
    slide.classList.toggle("is-active", isActive);
    slide.setAttribute("aria-hidden", String(!isActive));
  });

  Array.from(rail.children).forEach((button, buttonIndex) => {
    button.classList.toggle("is-active", buttonIndex === currentIndex);
    button.setAttribute("aria-current", buttonIndex === currentIndex ? "true" : "false");
  });

  const slide = slides[currentIndex];
  counter.textContent = `${twoDigits(currentIndex + 1)} / ${twoDigits(slides.length)}`;
  progressBar.style.width = `${((currentIndex + 1) / slides.length) * 100}%`;
  prevButton.disabled = currentIndex === 0;
  nextButton.disabled = currentIndex === slides.length - 1;
  updateNotes();

  if (!options.skipHash) {
    history.replaceState(null, "", `#${slide.id}`);
  }
}

function moveSlide(delta) {
  setSlide(currentIndex + delta);
}

function closeNotes() {
  notesDrawer.classList.remove("is-open");
  notesDrawer.setAttribute("aria-hidden", "true");
  notesButton.setAttribute("aria-pressed", "false");
}

function toggleNotes() {
  const shouldOpen = !notesDrawer.classList.contains("is-open");
  notesDrawer.classList.toggle("is-open", shouldOpen);
  notesDrawer.setAttribute("aria-hidden", String(!shouldOpen));
  notesButton.setAttribute("aria-pressed", String(shouldOpen));
  if (shouldOpen) {
    updateNotes();
  }
}

slides.forEach((slide, index) => {
  const railButton = document.createElement("button");
  railButton.type = "button";
  railButton.title = slide.dataset.title;
  railButton.setAttribute("aria-label", `Slide ${index + 1}: ${slide.dataset.title}`);
  railButton.addEventListener("click", () => setSlide(index));
  rail.appendChild(railButton);

  const overviewItem = document.createElement("button");
  overviewItem.type = "button";
  overviewItem.innerHTML = `<span>${twoDigits(index + 1)}</span><strong>${slide.dataset.title}</strong><span>${slide.dataset.duration}</span>`;
  overviewItem.addEventListener("click", () => {
    overviewDialog.close();
    setSlide(index);
  });
  overviewGrid.appendChild(overviewItem);
});

prevButton.addEventListener("click", () => moveSlide(-1));
nextButton.addEventListener("click", () => moveSlide(1));
notesButton.addEventListener("click", toggleNotes);
closeNotesButton.addEventListener("click", closeNotes);
overviewButton.addEventListener("click", () => overviewDialog.showModal());
closeOverviewButton.addEventListener("click", () => overviewDialog.close());

document.querySelectorAll("[data-zoom]").forEach((image) => {
  image.addEventListener("click", () => {
    zoomedImage.src = image.src;
    zoomedImage.alt = image.alt;
    imageDialog.showModal();
  });
});

closeImageButton.addEventListener("click", () => imageDialog.close());
imageDialog.addEventListener("click", (event) => {
  if (event.target === imageDialog) {
    imageDialog.close();
  }
});

async function toggleFullscreen() {
  if (document.fullscreenElement) {
    await document.exitFullscreen();
  } else {
    await document.documentElement.requestFullscreen();
  }
}

document.addEventListener("keydown", (event) => {
  if (event.target.matches("button, a, input, textarea") && event.key !== "Escape") {
    return;
  }

  if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") {
    event.preventDefault();
    moveSlide(1);
  } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
    event.preventDefault();
    moveSlide(-1);
  } else if (event.key === "Home") {
    event.preventDefault();
    setSlide(0);
  } else if (event.key === "End") {
    event.preventDefault();
    setSlide(slides.length - 1);
  } else if (event.key.toLowerCase() === "n") {
    event.preventDefault();
    toggleNotes();
  } else if (event.key.toLowerCase() === "f") {
    event.preventDefault();
    void toggleFullscreen();
  } else if (event.key === "Escape") {
    closeNotes();
  }
});

document.addEventListener("touchstart", (event) => {
  touchStartX = event.changedTouches[0].screenX;
}, { passive: true });

document.addEventListener("touchend", (event) => {
  const delta = event.changedTouches[0].screenX - touchStartX;
  if (Math.abs(delta) > 60) {
    moveSlide(delta < 0 ? 1 : -1);
  }
}, { passive: true });

window.addEventListener("hashchange", () => {
  const index = slides.findIndex((slide) => `#${slide.id}` === window.location.hash);
  if (index >= 0) {
    setSlide(index, { skipHash: true });
  }
});

const hashIndex = slides.findIndex((slide) => `#${slide.id}` === window.location.hash);
setSlide(hashIndex >= 0 ? hashIndex : 0, { skipHash: hashIndex >= 0 });
