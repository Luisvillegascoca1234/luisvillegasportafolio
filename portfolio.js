const datos = window.datosPortafolio;
for (const element of document.querySelectorAll('[data-field]')) {
  element.textContent = datos[element.dataset.field];
}
document.title = datos.nombre + ' — Portafolio 2026';
document.querySelector('meta[name="description"]').content = datos.nombre + ', ' + datos.profesion.toLowerCase() + '. ' + datos.especialidades + '. Todas las áreas impulsadas por inteligencia artificial.';
for (const fact of document.querySelectorAll('[data-optional]')) {
  fact.hidden = !datos[fact.dataset.optional];
}

for (const image of document.querySelectorAll('[data-person-photo]')) {
  image.alt = 'Foto de ' + datos.nombre;
  const photo = image.dataset.personPhoto === 'portada' ? datos.fotoPortada || datos.foto : datos.foto;
  if (!photo) continue;
  image.addEventListener('load', () => {
    image.hidden = false;
    image.parentElement.classList.add('has-photo');
  });
  image.src = photo;
}

let hasContact = false;
for (const link of document.querySelectorAll('[data-contact]')) {
  const field = link.dataset.contact;
  const value = datos[field].trim();
  if (!value) continue;
  if (field === 'email') {
    link.href = 'mailto:' + value;
    link.textContent = value + ' ↗';
  } else if (field === 'telefono') {
    link.href = 'tel:' + value.replace(/[^+\d]/g, '');
    link.textContent = value;
  } else {
    try {
      const url = new URL(value);
      if (!['https:', 'http:'].includes(url.protocol)) continue;
      link.href = url.href;
    } catch {
      continue;
    }
  }
  link.hidden = false;
  hasContact = true;
}
document.querySelector('.contact-pending').hidden = hasContact;

const animations = Array.from(document.querySelectorAll('[data-loop-src]'));
const motionButton = document.querySelector('.motion-toggle');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const visibleAnimations = new Set();
const hero = document.querySelector('.hero-composition');
let animationOverride = new URLSearchParams(window.location.search).get('animacion') === '1' ? true : undefined;
let heroReady = false;
let heroVisible = false;

function syncAnimations() {
  const enabled = animationOverride ?? !reducedMotion.matches;
  document.body.dataset.motion = enabled ? 'enabled' : 'disabled';
  document.body.classList.toggle('animations-paused', !enabled || document.hidden);
  motionButton.setAttribute('aria-pressed', String(enabled));
  motionButton.querySelector('span').textContent = enabled ? 'activas' : 'en pausa';
  hero.classList.toggle('hero-preparing', !heroReady && enabled);
  if (!heroVisible) hero.classList.remove('hero-intro');
  else if (heroReady && enabled) hero.classList.add('hero-intro');
  for (const video of animations) {
    if (enabled && !document.hidden && visibleAnimations.has(video)) {
      if (!video.hasAttribute('src')) video.src = video.dataset.loopSrc;
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }
}

const observer = new IntersectionObserver(entries => {
  for (const { target, isIntersecting } of entries) {
    if (isIntersecting) visibleAnimations.add(target);
    else visibleAnimations.delete(target);
  }
  syncAnimations();
}, { threshold: 0.15 });

for (const video of animations) observer.observe(video);
motionButton.hidden = false;
motionButton.addEventListener('click', () => {
  animationOverride = !(animationOverride ?? !reducedMotion.matches);
  syncAnimations();
});
reducedMotion.addEventListener('change', syncAnimations);
document.addEventListener('visibilitychange', syncAnimations);
syncAnimations();

const heroObserver = new IntersectionObserver(([entry]) => {
  heroVisible = entry.isIntersecting && entry.intersectionRatio >= 0.25;
  syncAnimations();
}, { threshold: 0.25 });
heroObserver.observe(hero);

Promise.allSettled(Array.from(hero.querySelectorAll('img'), image => image.decode())).then(() => {
  heroReady = true;
  syncAnimations();
});

function replayHeroEntrance() {
  hero.classList.remove('hero-intro');
  void hero.offsetWidth;
  syncAnimations();
}

document.querySelector('.hero-play').addEventListener('click', () => {
  animationOverride = true;
  replayHeroEntrance();
});

for (const link of document.querySelectorAll('a[href="#inicio"]')) {
  link.addEventListener('click', replayHeroEntrance);
}

const viewer = document.querySelector('.viewer');
const viewerTitle = viewer.querySelector('#viewer-title');
const viewerMedia = viewer.querySelector('.viewer-media');
const viewerPages = viewer.querySelector('.viewer-pages');
const viewerCount = viewer.querySelector('.viewer-count');
let items = [];
let current = 0;

function renderViewer() {
  const link = items[current];
  viewerTitle.textContent = link.dataset.title;
  viewerPages.hidden = items.length < 2;

  const image = document.createElement('img');
  image.src = link.href;
  image.alt = link.querySelector('img').alt;
  viewerCount.textContent = (current + 1) + ' / ' + items.length;
  viewerMedia.replaceChildren(image);
}

function stepViewer(step) {
  if (items.length < 2) return;
  current = (current + step + items.length) % items.length;
  renderViewer();
}

document.addEventListener('click', event => {
  const link = event.target.closest('[data-gallery]');
  if (!link || event.defaultPrevented || event.button !== 0 || event.ctrlKey ||
      event.metaKey || event.shiftKey || event.altKey || !viewer.showModal) return;
  event.preventDefault();
  items = Array.from(document.querySelectorAll('[data-gallery="' + link.dataset.gallery + '"]:not([hidden])'));
  current = items.indexOf(link);
  renderViewer();
  viewer.showModal();
});

viewer.querySelector('[data-close]').addEventListener('click', () => viewer.close());
for (const button of viewer.querySelectorAll('[data-step]')) {
  button.addEventListener('click', () => stepViewer(Number(button.dataset.step)));
}
viewer.addEventListener('keydown', event => {
  if (items.length < 2 || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
  event.preventDefault();
  stepViewer(event.key === 'ArrowLeft' ? -1 : 1);
});
viewer.addEventListener('click', event => {
  if (event.target !== viewer) return;
  const bounds = viewer.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom) viewer.close();
});
viewer.addEventListener('close', () => viewerMedia.replaceChildren());

for (const button of document.querySelectorAll('[data-filter]')) {
  button.addEventListener('click', () => {
    const category = button.dataset.filter;
    for (const filter of document.querySelectorAll('[data-filter]')) {
      filter.setAttribute('aria-pressed', String(filter === button));
    }
    for (const item of document.querySelectorAll('[data-category]')) {
      item.hidden = category !== 'todas' && item.dataset.category !== category;
    }
    const count = document.querySelectorAll('[data-category]:not([hidden])').length;
    document.querySelector('.filter-status').textContent = count + (count === 1 ? ' imagen' : ' imágenes');
  });
}

for (const button of document.querySelectorAll('[data-preview-size]')) {
  button.addEventListener('click', () => {
    for (const control of document.querySelectorAll('[data-preview-size]')) {
      control.setAttribute('aria-pressed', String(control === button));
    }
    document.querySelector('.web-preview').classList.toggle('compact', button.dataset.previewSize === 'movil');
  });
}
