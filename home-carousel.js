(() => {
  const carousel = document.querySelector('.home-carousel');
  if (!carousel) return;

  const slides = [...carousel.querySelectorAll('.home-carousel-slide')];
  const controls = carousel.querySelector('.home-carousel-controls');
  const dots = [...carousel.querySelectorAll('[data-carousel-slide]')];
  const pauseButton = carousel.querySelector('[data-carousel-pause]');
  const stage = carousel.querySelector('.home-carousel-stage');
  if (slides.length < 2 || !controls || !pauseButton || !stage) return;

  let current = 0;
  let paused = false;
  let timer;

  function schedule() {
    window.clearTimeout(timer);
    if (paused || document.hidden || stage.contains(document.activeElement)) return;
    timer = window.setTimeout(() => show(current + 1), 5000);
  }

  function show(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, position) => {
      const active = position === current;
      slide.classList.toggle('is-active', active);
      slide.inert = !active;
      slide.setAttribute('aria-hidden', String(!active));
    });
    dots.forEach((dot, position) => dot.setAttribute('aria-pressed', String(position === current)));
    schedule();
  }

  function updatePause() {
    pauseButton.textContent = paused ? 'Retomar alternância' : 'Pausar alternância';
    stage.setAttribute('aria-live', paused ? 'polite' : 'off');
    schedule();
  }

  carousel.querySelector('[data-carousel-prev]').addEventListener('click', () => show(current - 1));
  carousel.querySelector('[data-carousel-next]').addEventListener('click', () => show(current + 1));
  dots.forEach((dot) => dot.addEventListener('click', () => show(Number(dot.dataset.carouselSlide))));
  pauseButton.addEventListener('click', () => {
    paused = !paused;
    updatePause();
  });
  // Keyboard focus on a banner link stays stable; controls can resume playback.
  stage.addEventListener('focusin', schedule);
  stage.addEventListener('focusout', () => window.setTimeout(schedule, 0));
  document.addEventListener('visibilitychange', schedule);

  controls.hidden = false;
  show(0);
  updatePause();
})();
