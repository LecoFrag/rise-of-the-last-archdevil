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
  { file: "page-21.png", label: "Página 21" },
  { file: "page-22.png", label: "Página 22" },
  { file: "page-23.png", label: "Página 23" },
  { file: "page-24.png", label: "Página 24" },
  { file: "page-25.png", label: "Página 25" },
  { file: "page-26.png", label: "Página 26" },
  { file: "page-27.png", label: "Página 27" },
  { file: "page-28.png", label: "Página 28" },
  { file: "page-29.png", label: "Página 29" },
  { file: "page-30.png", label: "Página 30" },
  { file: "page-31.png", label: "Página 31" },
  { file: "page-32.png", label: "Página 32" },
  { file: "page-33.png", label: "Página 33" },
  { file: "page-34.png", label: "Página 34" },
  { file: "page-35.png", label: "Página 35" },
  { file: "page-36.png", label: "Página 36" },
  { file: "page-37.png", label: "Página 37" },
  { file: "page-38.png", label: "Quarta capa" }
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
  zoomOut: document.querySelector("#zoomOutButton"),
  zoomFit: document.querySelector("#zoomFitButton"),
  zoomIn: document.querySelector("#zoomInButton"),
  fullscreen: document.querySelector("#fullscreenButton")
};

const desktopQuery = window.matchMedia("(min-width: 780px) and (hover: hover) and (pointer: fine)");
const fullscreenSupported = Boolean(document.fullscreenEnabled && document.documentElement.requestFullscreen);
const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.25;
let currentIndex = 0;
let preferSpread = localStorage.getItem("hq-layout") !== "single";
let transitionTimer;
let zoomSettleTimer;
const pointers = new Map();
const zoomState = {
  scale: 1,
  x: 0,
  y: 0,
  lastX: 0,
  lastY: 0,
  pinchDistance: 0,
  pinchScale: 1,
  pinchX: 0,
  pinchY: 0,
  pinchCenterX: 0,
  pinchCenterY: 0
};

function applyZoom() {
  const translate = elements.book.classList.contains("interacting")
    ? `translate3d(${zoomState.x}px, ${zoomState.y}px, 0)`
    : `translate(${zoomState.x}px, ${zoomState.y}px)`;
  elements.book.style.transform = `${translate} scale(${zoomState.scale})`;
  elements.book.classList.toggle("zoomed", zoomState.scale > 1.001);
  const percentage = Math.round(zoomState.scale * 100);
  elements.zoomOut.disabled = zoomState.scale <= MIN_ZOOM;
  elements.zoomFit.disabled = zoomState.scale <= MIN_ZOOM;
  elements.zoomIn.disabled = zoomState.scale >= MAX_ZOOM;
  elements.zoomFit.setAttribute("aria-label", `Ajustar imagem à tela. Zoom atual: ${percentage}%`);
  elements.zoomFit.title = `Ajustar imagem à tela — zoom atual: ${percentage}% (0)`;
}

function beginZoomInteraction() {
  clearTimeout(zoomSettleTimer);
  elements.book.classList.add("interacting");
  applyZoom();
}

function settleZoom(delay = 0) {
  clearTimeout(zoomSettleTimer);
  const rerender = () => {
    elements.book.classList.remove("interacting");
    elements.book.style.transform = "none";
    void elements.book.offsetWidth;
    applyZoom();
  };

  if (delay > 0) zoomSettleTimer = setTimeout(rerender, delay);
  else rerender();
}

function clampPan() {
  if (zoomState.scale <= MIN_ZOOM) {
    zoomState.scale = MIN_ZOOM;
    zoomState.x = 0;
    zoomState.y = 0;
    return;
  }

  const rect = elements.book.getBoundingClientRect();
  const baseWidth = rect.width / zoomState.scale;
  const baseHeight = rect.height / zoomState.scale;
  const maxX = Math.max(0, (baseWidth * zoomState.scale - elements.stage.clientWidth) / 2);
  const maxY = Math.max(0, (baseHeight * zoomState.scale - elements.stage.clientHeight) / 2);
  zoomState.x = Math.max(-maxX, Math.min(maxX, zoomState.x));
  zoomState.y = Math.max(-maxY, Math.min(maxY, zoomState.y));
}

function setZoom(nextScale, clientX, clientY) {
  const scale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextScale));
  if (Math.abs(scale - zoomState.scale) < 0.001) return;

  const stageRect = elements.stage.getBoundingClientRect();
  const originX = stageRect.left + stageRect.width / 2;
  const originY = stageRect.top + stageRect.height / 2;
  const focusX = clientX ?? originX;
  const focusY = clientY ?? originY;
  const ratio = scale / zoomState.scale;

  zoomState.x = focusX - originX - (focusX - originX - zoomState.x) * ratio;
  zoomState.y = focusY - originY - (focusY - originY - zoomState.y) * ratio;
  zoomState.scale = scale;
  clampPan();
  applyZoom();
}

function resetZoom() {
  clearTimeout(zoomSettleTimer);
  pointers.clear();
  elements.book.classList.remove("dragging", "interacting");
  zoomState.scale = 1;
  zoomState.x = 0;
  zoomState.y = 0;
  applyZoom();
}

function fitPageToViewport() {
  resetZoom();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      resetZoom();
      clampPan();
      applyZoom();
    });
  });
}

function beginPinch() {
  const [first, second] = [...pointers.values()];
  zoomState.pinchDistance = Math.hypot(second.x - first.x, second.y - first.y) || 1;
  zoomState.pinchScale = zoomState.scale;
  zoomState.pinchX = zoomState.x;
  zoomState.pinchY = zoomState.y;
  zoomState.pinchCenterX = (first.x + second.x) / 2;
  zoomState.pinchCenterY = (first.y + second.y) / 2;
}

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
  resetZoom();
  currentIndex = Math.max(0, Math.min(pages.length - 1, spreadStart(currentIndex)));
  const spread = isSpread() && currentIndex + 1 < pages.length;

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

elements.zoomOut.addEventListener("click", () => setZoom(zoomState.scale - ZOOM_STEP));
elements.zoomFit.addEventListener("click", resetZoom);
elements.zoomIn.addEventListener("click", () => setZoom(zoomState.scale + ZOOM_STEP));

elements.stage.addEventListener("wheel", (event) => {
  if (!desktopQuery.matches) return;
  event.preventDefault();
  beginZoomInteraction();
  const limitedDelta = Math.max(-120, Math.min(120, event.deltaY));
  const factor = Math.exp(-limitedDelta * 0.002);
  setZoom(zoomState.scale * factor, event.clientX, event.clientY);
  settleZoom(90);
}, { passive: false });

elements.fullscreen.addEventListener("click", async () => {
  if (!fullscreenSupported) return;
  try {
    if (!document.fullscreenElement) {
      fitPageToViewport();
      await document.documentElement.requestFullscreen({ navigationUI: "hide" });
    } else {
      await document.exitFullscreen();
    }
  } catch (_) {
    elements.fullscreen.hidden = true;
  }
});

document.addEventListener("fullscreenchange", () => {
  const active = Boolean(document.fullscreenElement);
  document.documentElement.classList.toggle("fullscreen-active", active);
  elements.fullscreen.setAttribute("aria-label", active ? "Sair da tela cheia" : "Abrir em tela cheia");
  elements.fullscreen.title = active ? "Sair da tela cheia" : "Tela cheia";
  fitPageToViewport();
});

document.addEventListener("keydown", (event) => {
  const isControl = event.target instanceof HTMLButtonElement || event.target instanceof HTMLInputElement;
  if (!isControl && (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ")) {
    event.preventDefault();
    goNext();
  }
  if (!isControl && (event.key === "ArrowLeft" || event.key === "PageUp")) {
    event.preventDefault();
    goPrevious();
  }
  if (!isControl && event.key === "Home") {
    currentIndex = 0;
    render({ animate: true, direction: "backward" });
  }
  if (!isControl && event.key === "End") {
    currentIndex = pages.length - 1;
    render({ animate: true, direction: "forward" });
  }

  if (!desktopQuery.matches || event.ctrlKey || event.metaKey || event.altKey || isControl) return;
  if (event.key === "+" || event.key === "=") {
    event.preventDefault();
    setZoom(zoomState.scale + ZOOM_STEP);
  }
  if (event.key === "-") {
    event.preventDefault();
    setZoom(zoomState.scale - ZOOM_STEP);
  }
  if (event.key === "0") {
    event.preventDefault();
    resetZoom();
  }
});

elements.stage.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "mouse") {
    if (!desktopQuery.matches || event.button !== 0 || zoomState.scale <= MIN_ZOOM || event.target.closest("button")) return;
    event.preventDefault();
    elements.stage.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    zoomState.lastX = event.clientX;
    zoomState.lastY = event.clientY;
    elements.book.classList.add("dragging");
    beginZoomInteraction();
    return;
  }
  elements.stage.setPointerCapture(event.pointerId);
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

  if (pointers.size === 1) {
    zoomState.lastX = event.clientX;
    zoomState.lastY = event.clientY;
  } else if (pointers.size === 2) {
    beginZoomInteraction();
    beginPinch();
  }
});

elements.stage.addEventListener("pointermove", (event) => {
  if (!pointers.has(event.pointerId)) return;
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

  if (pointers.size === 1) {
    if (zoomState.scale > 1) {
      zoomState.x += event.clientX - zoomState.lastX;
      zoomState.y += event.clientY - zoomState.lastY;
      clampPan();
      applyZoom();
    }
    zoomState.lastX = event.clientX;
    zoomState.lastY = event.clientY;
    return;
  }

  if (pointers.size >= 2) {
    const [first, second] = [...pointers.values()];
    const distance = Math.hypot(second.x - first.x, second.y - first.y);
    const centerX = (first.x + second.x) / 2;
    const centerY = (first.y + second.y) / 2;
    const ratio = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomState.pinchScale * distance / zoomState.pinchDistance)) / zoomState.pinchScale;
    const stageRect = elements.stage.getBoundingClientRect();
    const originX = stageRect.left + stageRect.width / 2;
    const originY = stageRect.top + stageRect.height / 2;

    zoomState.scale = zoomState.pinchScale * ratio;
    zoomState.x = centerX - originX - (zoomState.pinchCenterX - originX - zoomState.pinchX) * ratio;
    zoomState.y = centerY - originY - (zoomState.pinchCenterY - originY - zoomState.pinchY) * ratio;
    clampPan();
    applyZoom();
  }
});

function finishPointer(event) {
  pointers.delete(event.pointerId);
  if (event.pointerType === "mouse") elements.book.classList.remove("dragging");
  if (pointers.size === 1) {
    if (event.pointerType !== "mouse") settleZoom();
    const remaining = [...pointers.values()][0];
    zoomState.lastX = remaining.x;
    zoomState.lastY = remaining.y;
  } else if (pointers.size >= 2) {
    beginPinch();
  }
  if (pointers.size === 0) settleZoom();
}

elements.stage.addEventListener("pointerup", finishPointer);
elements.stage.addEventListener("pointercancel", finishPointer);
elements.stage.addEventListener("lostpointercapture", finishPointer);

window.addEventListener("resize", () => {
  clampPan();
  applyZoom();
});

desktopQuery.addEventListener("change", () => render());

elements.fullscreen.hidden = !fullscreenSupported;
elements.slider.max = String(pages.length);
const requestedPage = Number(location.hash.match(/pagina-(\d+)/)?.[1]);
if (Number.isInteger(requestedPage)) currentIndex = Math.max(0, Math.min(pages.length - 1, requestedPage - 1));
render();
