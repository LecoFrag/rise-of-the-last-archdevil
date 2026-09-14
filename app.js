const pages = [
  { file: "page-01.png", label: "Capa" },
  { file: "page-02.png", label: "Página 2" },
  { file: "page-03.png", label: "Página 3" },
  { file: "page-04.png", label: "Página 4" },
  { file: "page-05.png", label: "Página 5" },
  { file: "page-06.png", label: "Página 6" },
  { file: "page-07.png", label: "Página 7" },
  { file: "page-08.png", label: "Página 8" },
  { file: "page-09.png", label: "Página 9" },
  { file: "page-10.png", label: "Página 10" },
  { file: "page-11.png", label: "Página 11" },
  { file: "page-12.png", label: "Página 12" },
  { file: "page-13.png", label: "Página 13" },
  { file: "page-14.png", label: "Página 14" },
  { file: "page-15.png", label: "Página 15" },
  { file: "page-16.png", label: "Página 16" },
  { file: "page-17.png", label: "Página 17" },
  { file: "page-18.png", label: "Página 18" },
  { file: "page-19.png", label: "Página 19" },
  { file: "page-20.png", label: "Página 20" },
  { file: "page-21.png", label: "Quarta capa" }
];

const elements = {
  stage: document.querySelector("#stage"),
  book: document.querySelector("#book"),
  left: document.querySelector("#leftPage"),
  right: document.querySelector("#rightPage"),
  previous: document.querySelector("#previousButton"),
  next: document.querySelector("#nextButton"),
  previousCompact: document.querySelector("#previousCompact"),
  nextCompact: document.querySelector("#nextCompact"),
  slider: document.querySelector("#pageSlider"),
  label: document.querySelector("#pageLabel"),
  count: document.querySelector("#pageCount"),
  layout: document.querySelector("#layoutButton"),
  fullscreen: document.querySelector("#fullscreenButton")
};

const desktopQuery = window.matchMedia("(min-width: 780px)");
let currentIndex = 0;
let preferSpread = localStorage.getItem("hq-layout") !== "single";
let touchStartX = 0;
let touchStartY = 0;
let singleTouchGesture = false;
let transitionTimer;

function isSpread() {
  return desktopQuery.matches && preferSpread && currentIndex > 0;
}

function spreadStart(index) {
  if (!desktopQuery.matches || !preferSpread || index === 0) return index;
  return index % 2 === 1 ? index : index - 1;
}

function describe(index) {
  if (index === 0) return "Capa";
  if (index === pages.length - 1) return "Quarta capa";
  return `Página ${index + 1}`;
}

function setFigure(figure, index) {
  if (index < 0 || index >= pages.length) {
    figure.classList.add("hidden");
    return;
  }
  const image = figure.querySelector("img");
  image.src = `pages/${pages[index].file}`;
  image.alt = `${describe(index)} da HQ Rise of the Last Archdevil — Os Três Corações`;
  figure.classList.remove("hidden");
}

function preloadAround(index) {
  [index + 1, index + 2, index - 1].forEach((candidate) => {
    if (candidate >= 0 && candidate < pages.length) {
      const image = new Image();
      image.src = `pages/${pages[candidate].file}`;
    }
  });
}

function render({ animate = false, direction = "forward" } = {}) {
  currentIndex = Math.max(0, Math.min(pages.length - 1, spreadStart(currentIndex)));
  const spread = isSpread();

  if (animate) {
    elements.book.classList.remove("changing-forward", "changing-backward");
    void elements.book.offsetWidth;
    elements.book.classList.add(direction === "forward" ? "changing-forward" : "changing-backward");
    clearTimeout(transitionTimer);
    transitionTimer = setTimeout(() => elements.book.classList.remove("changing-forward", "changing-backward"), 170);
  }

  elements.book.classList.toggle("spread", spread);
  elements.book.classList.toggle("single", !spread);

  if (spread) {
    setFigure(elements.left, currentIndex);
    setFigure(elements.right, currentIndex + 1);
  } else {
    elements.left.classList.add("hidden");
    setFigure(elements.right, currentIndex);
  }

  const lastVisible = spread ? Math.min(currentIndex + 1, pages.length - 1) : currentIndex;
  const visibleLabel = spread ? `${describe(currentIndex)}–${describe(lastVisible).replace("Página ", "")}` : describe(currentIndex);
  elements.label.textContent = visibleLabel;
  elements.count.textContent = spread ? `${currentIndex + 1}–${lastVisible + 1} / ${pages.length}` : `${currentIndex + 1} / ${pages.length}`;
  elements.slider.value = String(currentIndex + 1);
  elements.book.setAttribute("aria-label", `${visibleLabel} de ${pages.length}`);
  elements.previous.disabled = currentIndex === 0;
  elements.previousCompact.disabled = currentIndex === 0;
  elements.next.disabled = lastVisible >= pages.length - 1;
  elements.nextCompact.disabled = lastVisible >= pages.length - 1;
  elements.layout.setAttribute("aria-pressed", String(preferSpread));
  elements.layout.title = preferSpread ? "Usar uma página por vez" : "Usar livro aberto";
  document.title = `${describe(currentIndex)} · Rise of the Last Archdevil`;
  history.replaceState(null, "", `#pagina-${currentIndex + 1}`);
  preloadAround(lastVisible);
}

function goNext() {
  const amount = isSpread() ? 2 : 1;
  if (currentIndex + amount < pages.length) {
    currentIndex += amount;
    render({ animate: true, direction: "forward" });
  }
}

function goPrevious() {
  if (currentIndex === 0) return;
  const amount = isSpread() ? 2 : 1;
  currentIndex = Math.max(0, currentIndex - amount);
  render({ animate: true, direction: "backward" });
}

elements.previous.addEventListener("click", goPrevious);
elements.next.addEventListener("click", goNext);
elements.previousCompact.addEventListener("click", goPrevious);
elements.nextCompact.addEventListener("click", goNext);

elements.slider.addEventListener("input", (event) => {
  const nextIndex = Number(event.target.value) - 1;
  const direction = nextIndex >= currentIndex ? "forward" : "backward";
  currentIndex = nextIndex;
  render({ animate: true, direction });
});

elements.layout.addEventListener("click", () => {
  preferSpread = !preferSpread;
  localStorage.setItem("hq-layout", preferSpread ? "spread" : "single");
  render();
});

elements.fullscreen.addEventListener("click", async () => {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    else await document.exitFullscreen();
  } catch (_) {
    elements.fullscreen.hidden = true;
  }
});

document.addEventListener("fullscreenchange", () => {
  const active = Boolean(document.fullscreenElement);
  elements.fullscreen.setAttribute("aria-label", active ? "Sair da tela cheia" : "Abrir em tela cheia");
  elements.fullscreen.title = active ? "Sair da tela cheia" : "Tela cheia";
});

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") {
    event.preventDefault();
    goNext();
  }
  if (event.key === "ArrowLeft" || event.key === "PageUp") {
    event.preventDefault();
    goPrevious();
  }
  if (event.key === "Home") {
    currentIndex = 0;
    render({ animate: true, direction: "backward" });
  }
  if (event.key === "End") {
    currentIndex = pages.length - 1;
    render({ animate: true, direction: "forward" });
  }
});

elements.stage.addEventListener("touchstart", (event) => {
  singleTouchGesture = event.touches.length === 1;
  if (!singleTouchGesture) return;
  const touch = event.changedTouches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
}, { passive: true });

elements.stage.addEventListener("touchmove", (event) => {
  if (event.touches.length > 1) singleTouchGesture = false;
}, { passive: true });

elements.stage.addEventListener("touchend", (event) => {
  if (!singleTouchGesture || event.touches.length > 0) return;
  singleTouchGesture = false;
  const touch = event.changedTouches[0];
  const deltaX = touch.clientX - touchStartX;
  const deltaY = touch.clientY - touchStartY;
  if (Math.abs(deltaX) > 48 && Math.abs(deltaX) > Math.abs(deltaY) * 1.25) {
    if (deltaX < 0) goNext();
    else goPrevious();
  }
}, { passive: true });

desktopQuery.addEventListener("change", () => render());

const requestedPage = Number(location.hash.match(/pagina-(\d+)/)?.[1]);
if (Number.isInteger(requestedPage)) currentIndex = Math.max(0, Math.min(pages.length - 1, requestedPage - 1));
render();
