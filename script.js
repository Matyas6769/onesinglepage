document.documentElement.classList.add("js");

const header = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".site-nav");
const year = document.querySelector("#current-year");

if (year) {
  year.textContent = String(new Date().getFullYear());
}

const validationPageUrl = window.location.href;
const htmlValidatorUrl = new URL("https://validator.w3.org/nu/");
htmlValidatorUrl.searchParams.set("doc", validationPageUrl);
const cssValidatorUrl = new URL("https://jigsaw.w3.org/css-validator/validator");
cssValidatorUrl.searchParams.set("uri", new URL("styles.css", validationPageUrl).href);
cssValidatorUrl.searchParams.set("profile", "css3");
cssValidatorUrl.searchParams.set("usermedium", "all");

document.querySelector('[data-validator="html"]')?.setAttribute("href", htmlValidatorUrl.href);
document.querySelector('[data-validator="css"]')?.setAttribute("href", cssValidatorUrl.href);

const setHeaderState = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 24);
};

setHeaderState();
window.addEventListener("scroll", setHeaderState, { passive: true });

if (menuToggle && navigation) {
  const closeMenu = () => {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Otevřít navigaci");
    navigation.classList.remove("is-open");
  };

  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Otevřít navigaci" : "Zavřít navigaci");
    navigation.classList.toggle("is-open", !isOpen);
  });

  navigation.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });
}

const revealElements = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 }
  );

  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("is-visible"));
}

const configurator = document.querySelector(".configurator");

if (configurator) {
  const currency = new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  });
  const basePrice = Number(configurator.querySelector("#base-price")?.textContent.replace(/[^\d]/g, ""));
  const resetButton = configurator.querySelector("#reset-configuration");
  let lastSelectedExtra = null;

  const formatPrice = (amount) => currency.format(amount);

  const setPreviewImage = (image, source, altText) => {
    if (!image || !source) return;
    image.alt = altText;

    if (image.getAttribute("src") === source) return;

    image.classList.add("is-changing");
    const finishLoading = (event) => {
      image.removeEventListener("load", finishLoading);
      image.removeEventListener("error", finishLoading);
      image.classList.remove("is-changing");
      if (event?.type === "error") {
        console.error(`Nepodařilo se načíst fotografii konfigurátoru: ${source}`);
      }
    };

    image.addEventListener("load", finishLoading);
    image.addEventListener("error", finishLoading);
    image.src = source;

    if (image.complete) {
      finishLoading({ type: image.naturalWidth > 0 ? "load" : "error" });
    }
  };

  const updateConfiguration = () => {
    let optionsTotal = 0;
    const selections = {};
    const selectedOptions = {};

    configurator.querySelectorAll("[data-config-group]").forEach((group) => {
      const selected = group.querySelector("[data-config-option].is-selected");
      if (selected) {
        const key = group.dataset.configGroup;
        selections[key] = selected.dataset.name;
        selectedOptions[key] = selected;
        optionsTotal += Number(selected.dataset.price);
      }
    });

    const extras = [...configurator.querySelectorAll("[data-extra]:checked")];
    extras.forEach((extra) => {
      optionsTotal += Number(extra.dataset.price);
    });

    configurator.querySelector("#configuration-color").textContent = selections.color || "";
    configurator.querySelector("#summary-color").textContent = selections.color || "—";
    configurator.querySelector("#summary-wheels").textContent = selections.wheels || "—";
    configurator.querySelector("#summary-interior").textContent = selections.interior || "—";

    const selectedColor = selectedOptions.color;
    if (selectedColor) {
      const photoPaint = selectedColor.dataset.photoPaint;
      setPreviewImage(
        configurator.querySelector("#configuration-image"),
        selectedColor.dataset.previewSrc,
        selectedColor.dataset.previewAlt
      );
      configurator.querySelector("#configuration-photo-note").textContent =
        `Referenční fotografie Porsche 911 GT3 RS · ${photoPaint}`;
    }

    const selectedWheels = selectedOptions.wheels;
    if (selectedWheels) {
      setPreviewImage(
        configurator.querySelector("#wheel-preview-image"),
        selectedWheels.dataset.detailSrc,
        selectedWheels.dataset.detailAlt
      );
      configurator.querySelector("#wheel-preview-name").textContent = selections.wheels;
      configurator.querySelector("#wheel-preview-note").textContent = selectedWheels.dataset.detailNote;
    }

    const selectedInterior = selectedOptions.interior;
    if (selectedInterior) {
      setPreviewImage(
        configurator.querySelector("#interior-preview-image"),
        selectedInterior.dataset.detailSrc,
        selectedInterior.dataset.detailAlt
      );
      configurator.querySelector("#interior-preview-name").textContent = selections.interior;
      configurator.querySelector("#interior-preview-note").textContent = selectedInterior.dataset.detailNote;
    }

    const extrasRow = configurator.querySelector("#summary-extras-row");
    extrasRow.hidden = extras.length === 0;
    configurator.querySelector("#summary-extras").textContent = extras.map((extra) => extra.dataset.name).join(", ");

    const extraPreview = configurator.querySelector("#extra-preview");
    const visibleExtra = extras.includes(lastSelectedExtra)
      ? lastSelectedExtra
      : extras[extras.length - 1];
    extraPreview.hidden = !visibleExtra;
    if (visibleExtra) {
      setPreviewImage(
        configurator.querySelector("#extra-preview-image"),
        visibleExtra.dataset.detailSrc,
        visibleExtra.dataset.detailAlt
      );
      configurator.querySelector("#extra-preview-name").textContent = visibleExtra.dataset.name;
      configurator.querySelector("#extra-preview-note").textContent = visibleExtra.dataset.detailNote;
    }

    configurator.querySelector("#options-price").textContent = formatPrice(optionsTotal);
    configurator.querySelector("#total-price").textContent = formatPrice(basePrice + optionsTotal);
  };

  configurator.querySelectorAll("[data-config-option]").forEach((option) => {
    option.addEventListener("click", () => {
      const group = option.closest("[data-config-group]");
      if (!group) return;

      group.querySelectorAll("[data-config-option]").forEach((item) => {
        const isSelected = item === option;
        item.classList.toggle("is-selected", isSelected);
        item.setAttribute("aria-pressed", String(isSelected));
      });

      updateConfiguration();
    });
  });

  configurator.querySelectorAll("[data-extra]").forEach((extra) => {
    extra.addEventListener("change", () => {
      if (extra.checked) {
        lastSelectedExtra = extra;
      } else {
        const checkedExtras = [...configurator.querySelectorAll("[data-extra]:checked")];
        lastSelectedExtra = checkedExtras[checkedExtras.length - 1] || null;
      }
      updateConfiguration();
    });
  });

  resetButton?.addEventListener("click", () => {
    configurator.querySelectorAll("[data-config-group]").forEach((group) => {
      const defaultOption = group.querySelector('[data-config-option][data-default="true"]');
      if (!defaultOption) return;

      group.querySelectorAll("[data-config-option]").forEach((option) => {
        const isSelected = option === defaultOption;
        option.classList.toggle("is-selected", isSelected);
        option.setAttribute("aria-pressed", String(isSelected));
      });
    });

    configurator.querySelectorAll("[data-extra]").forEach((extra) => {
      extra.checked = false;
    });

    lastSelectedExtra = null;
    updateConfiguration();
  });

  updateConfiguration();
}
