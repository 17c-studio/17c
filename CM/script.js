const pathLinks = document.querySelector(".path-links");
const tabs = Array.from(pathLinks.querySelectorAll("a"));
const panels = tabs.map((tab) => document.querySelector(tab.hash));

pathLinks.setAttribute("role", "tablist");
const stackedPaths = matchMedia("(max-width: 530px)");

function syncOrientation() {
  pathLinks.setAttribute("aria-orientation", stackedPaths.matches ? "vertical" : "horizontal");
}

syncOrientation();
stackedPaths.addEventListener("change", syncOrientation);

function selectPath(index, moveFocus = false) {
  tabs.forEach((tab, position) => {
    const active = index === position;
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
    panels[position].hidden = !active;
  });

  if (moveFocus) {
    tabs[index].focus();
  }
}

tabs.forEach((tab, index) => {
  tab.setAttribute("role", "tab");
  tab.setAttribute("aria-controls", panels[index].id);
  panels[index].setAttribute("role", "tabpanel");
  panels[index].setAttribute("aria-labelledby", tab.id);
  panels[index].tabIndex = 0;

  tab.addEventListener("click", (event) => {
    event.preventDefault();
    selectPath(index);
  });
});

pathLinks.addEventListener("keydown", (event) => {
  const index = tabs.indexOf(event.target);
  if (index === -1) return;

  const last = tabs.length - 1;
  let next;
  switch (event.key) {
    case "ArrowDown":
    case "ArrowRight": next = (index + 1) % tabs.length; break;
    case "ArrowUp":
    case "ArrowLeft": next = (index + last) % tabs.length; break;
    case "Home": next = 0; break;
    case "End": next = last; break;
    case " ": next = index; break;
    default: return;
  }

  event.preventDefault();
  selectPath(next, true);
});

function syncLinkedPath() {
  const index = tabs.findIndex((tab) => tab.hash === location.hash);
  if (index !== -1) selectPath(index);
}

selectPath(0);
syncLinkedPath();
window.addEventListener("hashchange", syncLinkedPath);
