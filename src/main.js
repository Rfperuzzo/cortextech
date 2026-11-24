import { setupMotion } from './motion/narrative.js';
import { setupBriefing } from './briefing/form.js';
import { setupContact } from './contact.js';
import { setupTeam } from './team.js';

const header = document.querySelector('.header');
const toggle = header.querySelector('.menu-toggle');
const menu = document.querySelector('#menu-mobile');
const mobile = matchMedia('(max-width: 760px)');

function openMenu(open) {
  toggle.setAttribute('aria-expanded', String(open));
  toggle.innerHTML = open ? 'Fechar <span aria-hidden="true">−</span>' : 'Menu <span aria-hidden="true">+</span>';
  menu.hidden = !open;
}

header.classList.add('has-menu');
toggle.hidden = false;
toggle.addEventListener('click', () => openMenu(menu.hidden));
menu.addEventListener('click', event => {
  const link = event.target.closest('a');
  if (!link) return;
  openMenu(false);
  const destination = document.querySelector(link.hash);
  if (destination) {
    destination.tabIndex = -1;
    destination.focus({ preventScroll: true });
  }
});
header.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || menu.hidden) return;
  openMenu(false);
  toggle.focus();
});
mobile.addEventListener('change', () => openMenu(false));

setupBriefing();
setupContact();
setupTeam();
setupMotion();
