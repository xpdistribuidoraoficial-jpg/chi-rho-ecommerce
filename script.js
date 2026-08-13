const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav-row');
if (toggle && nav) {
  toggle.addEventListener('click', () => nav.classList.toggle('open'));
}
document.querySelectorAll('.nav-row a').forEach(link => {
  link.addEventListener('click', () => nav?.classList.remove('open'));
});
