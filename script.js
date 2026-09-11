// Mayo ASA — site behavior
// 1) mobile nav toggle  2) header shadow on scroll  3) scroll-reveal

document.addEventListener("DOMContentLoaded", function () {
  var donateBanner = document.getElementById("donate-banner");
  if (donateBanner) {
    var dismissKey = "masa-donate-banner-nepal-2026-dismissed";
    var dismissed = false;
    try { dismissed = localStorage.getItem(dismissKey) === "1"; } catch (e) {}
    if (dismissed) {
      donateBanner.hidden = true;
    } else {
      var closeBtn = donateBanner.querySelector(".donate-banner-close");
      if (closeBtn) {
        closeBtn.addEventListener("click", function () {
          donateBanner.hidden = true;
          try { localStorage.setItem(dismissKey, "1"); } catch (e) {}
        });
      }
    }
  }

  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".site-nav");

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  var masthead = document.querySelector(".masthead");
  if (masthead) {
    var updateScrolled = function () {
      masthead.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    updateScrolled();
    window.addEventListener("scroll", updateScrolled, { passive: true });
  }

  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  var revealEls = document.querySelectorAll(".reveal");
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  revealEls.forEach(function (el) { observer.observe(el); });
});
