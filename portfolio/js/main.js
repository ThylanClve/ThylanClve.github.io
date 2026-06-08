/* Reveal on scroll — fails safe: content stays visible if JS/IO is unavailable */
const reveals = document.querySelectorAll("[data-reveal]");
const show = (el) => el.classList.add("in");
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } });
  }, { threshold: 0.08, rootMargin: "0px 0px -5% 0px" });
  reveals.forEach((el) => io.observe(el));
  // safety: reveal whatever is already on screen once everything has loaded
  window.addEventListener("load", () => reveals.forEach((el) => {
    if (el.getBoundingClientRect().top < window.innerHeight) show(el);
  }));
} else {
  reveals.forEach(show);
}

/* Missing-image placeholder (figures + cards) */
document.querySelectorAll("figure img, .card-thumb").forEach((img) => {
  img.addEventListener("error", () => {
    const box = img.closest("figure, .card-thumb-wrap");
    if (!box) return;
    box.classList.add("missing");
    box.setAttribute("data-file", img.getAttribute("src").split("/").pop());
  });
});

/* Project filter by compétence */
const filters = document.querySelectorAll(".filter");
const cards = document.querySelectorAll("[data-competences]");
filters.forEach((btn) => {
  btn.addEventListener("click", () => {
    const f = btn.dataset.filter;
    filters.forEach((b) => b.setAttribute("aria-pressed", b === btn));
    cards.forEach((card) => {
      const match = f === "all" || card.dataset.competences.split(" ").includes(f);
      card.classList.toggle("is-hidden", !match);
    });
  });
});
