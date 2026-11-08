(() => {
  const navigation = document.querySelector('#store-navigation');
  if (!navigation) return;
  const toggle = document.querySelector('.menu-toggle');
  const groups = [...navigation.querySelectorAll('.nav-group')];
  const setGroup = (group, open) => {
    group.querySelector('.nav-disclosure').setAttribute('aria-expanded', String(open));
    group.querySelector('.nav-submenu').hidden = !open;
  };
  const closeGroups = () => groups.forEach(group => setGroup(group, false));
  const setMobile = open => {
    navigation.classList.toggle('open', open);
    toggle?.setAttribute('aria-expanded', String(open));
    toggle?.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    if (!open) closeGroups();
  };
  navigation.classList.add('nav-enhanced');
  toggle?.addEventListener('click', () => setMobile(!navigation.classList.contains('open')));
  groups.forEach(group => {
    const button = group.querySelector('.nav-disclosure');
    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') !== 'true';
      closeGroups();
      setGroup(group, open);
    });
  });
  navigation.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const open = groups.find(group => group.querySelector('.nav-disclosure').getAttribute('aria-expanded') === 'true');
    if (open) { setGroup(open, false); open.querySelector('.nav-disclosure').focus(); }
    else { setMobile(false); toggle?.focus(); }
    event.preventDefault();
  });
  navigation.addEventListener('click', event => { if (event.target.closest('a')) setMobile(false); });
  document.addEventListener('click', event => {
    if (!navigation.contains(event.target) && !toggle?.contains(event.target)) setMobile(false);
    if (event.target.closest('.catalog-filter')) queueMicrotask(updateCurrent);
  });
  navigation.addEventListener('focusout', event => {
    if (!navigation.contains(event.relatedTarget)) closeGroups();
  });
  function updateCurrent() {
    const file = location.pathname.split('/').pop() || 'index.html';
    const category = new URLSearchParams(location.search).get('categoria');
    const product = new URLSearchParams(location.search).get('produto');
    let section = file === 'catalogo-casa.html' ? 'casa'
      : file === 'catalogo-infantil.html' ? 'brinquedos'
      : file === 'catalogo-biblias.html' || file === 'catalogo-cpad.html' ? 'biblias' : null;
    if (category === 'kits-presentes' || category === 'cpad-kits' || product?.startsWith('kit-')) section = 'kits';
    else if (category === 'livros-cristaos' || category === 'cpad-livros') section = 'livros';
    else if (category?.startsWith('biblias') || category === 'cpad-biblias') section = 'biblias';
    else if (file === 'index.html' && location.hash === '#ofertas') section = 'ofertas';
    navigation.querySelectorAll('[data-nav-section]').forEach(item => item.classList.toggle('is-current', item.dataset.navSection === section));
    navigation.querySelectorAll('a').forEach(link => {
      const url = new URL(link.getAttribute('href'), location.href);
      const exact = (url.pathname.split('/').pop() || 'index.html') === file && url.search === location.search && url.hash === location.hash;
      if (exact) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
    });
  }
  window.addEventListener('hashchange', updateCurrent);
  window.addEventListener('popstate', updateCurrent);
  window.matchMedia('(max-width:860px)').addEventListener('change', () => setMobile(false));
  updateCurrent();
})();
