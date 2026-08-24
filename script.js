/* ==========================================================================
   Vastu Vihar — Purnea Campaign Landing Page
   Vanilla JavaScript: config, tracking, forms, UI
   ========================================================================== */
(function () {
  "use strict";

  /* ------------------------------------------------------------------------
     1. CONFIGURATION
     Marketing/dev team: fill these in per-campaign. Leave blank strings to
     disable a given integration safely (all calls below are guarded).
     No secret keys belong here — this file is public and ships to the browser.
     ------------------------------------------------------------------------ */
  const CONFIG = {
    // Backend endpoint that receives lead payloads (POST, JSON body).
    // Must be a public endpoint that itself holds any required secrets server-side.
    leadApiUrl: "",

    // WhatsApp number in international format, no "+" or spaces, e.g. "919534095340"
    whatsappNumber: "919534095340",

    // Primary phone number for tel: links, e.g. "+919534095340"
    phoneNumber: "+919534095340",

    // Google Ads
    googleAdsConversionId: "",     // e.g. "AW-XXXXXXXXX"
    googleAdsConversionLabel: "",  // e.g. "AbCdEfGhIjKlMnOp"

    // Meta (Facebook/Instagram) Pixel
    metaPixelId: "",               // e.g. "1234567890123456"

    // Google Analytics 4
    gaMeasurementId: "",           // e.g. "G-XXXXXXXXXX"

    // Google Maps embed URL for the Purnea site(s).
    mapEmbedUrl: "https://www.google.com/maps?q=Vastu+Vihar+Purnea+Bihar&output=embed",

    // Google Maps "get directions" URL. Configure before launch.
    directionsUrl: "https://www.google.com/maps/search/?api=1&query=Vastu+Vihar+Purnea"
  };

  const WHATSAPP_MESSAGE = "Hi, I'm interested in Vastu Vihar properties in Purnea. Please share details.";

  /* ------------------------------------------------------------------------
     2. UTM + ATTRIBUTION CAPTURE
     ------------------------------------------------------------------------ */
  const STORAGE_FIRST_TOUCH = "vv_purnea_first_touch";
  const STORAGE_LAST_TOUCH = "vv_purnea_last_touch";

  function getDeviceType() {
    const ua = navigator.userAgent || "";
    if (/tablet|ipad/i.test(ua)) return "tablet";
    if (/mobile|iphone|android/i.test(ua)) return "mobile";
    return "desktop";
  }

  function readUtmFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
    const data = {};
    let hasAny = false;

    keys.forEach(function (k) {
      const v = params.get(k);
      if (v) {
        data[k] = v;
        hasAny = true;
      }
    });

    return hasAny ? data : null;
  }

  function buildTouchRecord(utm) {
    return {
      utm_source: (utm && utm.utm_source) || "direct",
      utm_medium: (utm && utm.utm_medium) || "none",
      utm_campaign: (utm && utm.utm_campaign) || "none",
      utm_content: (utm && utm.utm_content) || "",
      utm_term: (utm && utm.utm_term) || "",
      referrer: document.referrer || "direct",
      landing_page: window.location.pathname,
      page_url: window.location.href,
      timestamp: new Date().toISOString(),
      device: getDeviceType()
    };
  }

  function safeGet(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* localStorage unavailable (private mode etc.) — attribution degrades gracefully */
    }
  }

  function initAttribution() {
    const urlUtm = readUtmFromUrl();
    const newTouch = buildTouchRecord(urlUtm);

    // First-touch: persist only once, on the very first visit.
    if (!safeGet(STORAGE_FIRST_TOUCH)) {
      safeSet(STORAGE_FIRST_TOUCH, newTouch);
    }

    // Last-touch: always refresh so the most recent campaign is captured,
    // but only overwrite with real UTM data (don't clobber a campaign visit
    // with a later "direct" navigation within the same session).
    const existingLastTouch = safeGet(STORAGE_LAST_TOUCH);

    if (urlUtm || !existingLastTouch) {
      safeSet(STORAGE_LAST_TOUCH, newTouch);
    }
  }

  function getAttribution() {
    return {
      first_touch: safeGet(STORAGE_FIRST_TOUCH) || buildTouchRecord(null),
      last_touch: safeGet(STORAGE_LAST_TOUCH) || buildTouchRecord(null)
    };
  }

  initAttribution();

  /* ------------------------------------------------------------------------
     3. TRACKING — dataLayer / GA4 / Google Ads / Meta Pixel
     ------------------------------------------------------------------------ */
  window.dataLayer = window.dataLayer || [];

  function track(eventName, payload) {
    const attribution = getAttribution();

    const eventData = Object.assign(
      {
        event: eventName,
        page_url: window.location.href,
        device: getDeviceType()
      },
      {
        utm_source: attribution.last_touch.utm_source,
        utm_medium: attribution.last_touch.utm_medium,
        utm_campaign: attribution.last_touch.utm_campaign,
        utm_content: attribution.last_touch.utm_content,
        utm_term: attribution.last_touch.utm_term
      },
      payload || {}
    );

    // GTM / dataLayer — always safe to push, no-op if GTM isn't installed yet.
    window.dataLayer.push(eventData);

    // GA4 direct event (only fires once gtag is loaded via loadGA4()).
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, eventData);
    }

    // Meta Pixel mapped events
    if (typeof window.fbq === "function") {
      const metaMap = {
        page_view: "PageView",
        view_property: "ViewContent",
        generate_lead: "Lead",
        whatsapp_click: "Contact",
        phone_click: "Contact"
      };

      const metaEvent = metaMap[eventName];

      if (metaEvent) {
        window.fbq("track", metaEvent, eventData);
      }
    }
  }

  function loadGA4() {
    if (!CONFIG.gaMeasurementId) return;

    const s = document.createElement("script");
    s.async = true;
    s.src =
      "https://www.googletagmanager.com/gtag/js?id=" +
      encodeURIComponent(CONFIG.gaMeasurementId);

    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];

    window.gtag = function () {
      window.dataLayer.push(arguments);
    };

    window.gtag("js", new Date());

    window.gtag("config", CONFIG.gaMeasurementId, {
      send_page_view: false
    });

    if (CONFIG.googleAdsConversionId) {
      window.gtag("config", CONFIG.googleAdsConversionId);
    }
  }

  function loadMetaPixel() {
    if (!CONFIG.metaPixelId) return;

    /* eslint-disable */
    (function (f, b, e, v, n, t, s) {
      if (f.fbq) return;

      n = f.fbq = function () {
        n.callMethod
          ? n.callMethod.apply(n, arguments)
          : n.queue.push(arguments);
      };

      if (!f._fbq) f._fbq = n;

      n.push = n;
      n.loaded = !0;
      n.version = "2.0";
      n.queue = [];

      t = b.createElement(e);
      t.async = !0;
      t.src = v;

      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(
      window,
      document,
      "script",
      "https://connect.facebook.net/en_US/fbevents.js"
    );
    /* eslint-enable */

    window.fbq("init", CONFIG.metaPixelId);
    window.fbq("track", "PageView");
  }

  function fireGoogleAdsConversion(label, extra) {
    if (
      !CONFIG.googleAdsConversionId ||
      typeof window.gtag !== "function"
    ) {
      return;
    }

    const sendTo =
      CONFIG.googleAdsConversionId + (label ? "/" + label : "");

    window.gtag(
      "event",
      "conversion",
      Object.assign(
        {
          send_to: sendTo
        },
        extra || {}
      )
    );
  }

  loadGA4();
  loadMetaPixel();

  document.addEventListener("DOMContentLoaded", function () {
    track("page_view", {});
  });

  /* ------------------------------------------------------------------------
     4. UTILITIES
     ------------------------------------------------------------------------ */
  function generateLeadId() {
    if (window.crypto && window.crypto.randomUUID) {
      return "VV-PUR-" + window.crypto.randomUUID();
    }

    return (
      "VV-PUR-" +
      Date.now().toString(36) +
      "-" +
      Math.random().toString(36).slice(2, 8)
    );
  }

  function isValidIndianMobile(value) {
    return /^[6-9]\d{9}$/.test(value.trim());
  }

  function setError(fieldId, message) {
    const errorEl = document.getElementById("err-" + fieldId);
    const inputEl = document.getElementById(fieldId);

    if (errorEl) {
      errorEl.textContent = message || "";
    }

    if (inputEl) {
      const field = inputEl.closest(".field");

      if (field) {
        field.classList.toggle("has-error", Boolean(message));
      }
    }
  }

  function whatsappUrl(customMessage) {
    return (
      "https://wa.me/" +
      CONFIG.whatsappNumber +
      "?text=" +
      encodeURIComponent(customMessage || WHATSAPP_MESSAGE)
    );
  }

  function applyWhatsappLinks() {
    document.querySelectorAll(".header-whatsapp").forEach(function (el) {
      el.setAttribute("href", whatsappUrl());
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener");
    });
  }

  function applyPhoneLinks() {
    document.querySelectorAll(".header-call").forEach(function (el) {
      el.setAttribute("href", "tel:" + CONFIG.phoneNumber);
    });
  }

  applyWhatsappLinks();
  applyPhoneLinks();

  /* Click tracking for phone / WhatsApp / generic CTA buttons */
  document.addEventListener("click", function (e) {
    const el = e.target.closest("[data-track]");

    if (!el) return;

    const eventName = el.getAttribute("data-track");

    const payload = {
      click_location: el.getAttribute("data-location") || ""
    };

    if (el.dataset.property) {
      payload.property = el.dataset.property;
    }

    track(eventName, payload);

    if (eventName === "phone_click") {
      fireGoogleAdsConversion(
        CONFIG.googleAdsConversionLabel,
        {
          value: 1,
          currency: "INR"
        }
      );
    }

    if (eventName === "whatsapp_click") {
      fireGoogleAdsConversion(
        CONFIG.googleAdsConversionLabel,
        {
          value: 1,
          currency: "INR"
        }
      );
    }
  });

  /* ------------------------------------------------------------------------
     5. LEAD SUBMISSION (shared by both forms)
     ------------------------------------------------------------------------ */
  function buildLeadPayload(form, leadId) {
    const attribution = getAttribution();
    const formData = new FormData(form);
    const data = {
      lead_id: leadId
    };

    formData.forEach(function (value, key) {
      data[key] = value;
    });

    data.first_touch = attribution.first_touch;
    data.last_touch = attribution.last_touch;
    data.referrer = document.referrer || "direct";
    data.landing_page = window.location.pathname;
    data.page_url = window.location.href;
    data.timestamp = new Date().toISOString();
    data.device = getDeviceType();

    return data;
  }

  function sendLead(payload) {
    if (!CONFIG.leadApiUrl) {
      // No backend configured yet — keep the funnel working end-to-end for QA.
      console.info(
        "[Vastu Vihar Purnea] Lead captured (leadApiUrl not configured):",
        payload
      );

      return Promise.resolve({
        ok: true,
        offline: true
      });
    }

    return fetch(CONFIG.leadApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        return {
          ok: res.ok
        };
      })
      .catch(function (err) {
        console.error(
          "[Vastu Vihar Purnea] Lead submission failed:",
          err
        );

        return {
          ok: false,
          error: err
        };
      });
  }

  function showThankYou() {
    const modal = document.getElementById("thankYouModal");

    if (!modal) return;

    modal.hidden = false;
    document.body.style.overflow = "hidden";

    const closeBtn = document.getElementById("modalClose");

    if (closeBtn) {
      closeBtn.focus();
    }
  }

  function hideThankYou() {
    const modal = document.getElementById("thankYouModal");

    if (!modal) return;

    modal.hidden = true;
    document.body.style.overflow = "";
  }

  const modalBackdrop = document.getElementById("modalBackdrop");
  const modalClose = document.getElementById("modalClose");

  if (modalBackdrop) {
    modalBackdrop.addEventListener("click", hideThankYou);
  }

  if (modalClose) {
    modalClose.addEventListener("click", hideThankYou);
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      hideThankYou();
    }
  });

  function handleFormSubmit(config) {
    const form = document.getElementById(config.formId);

    if (!form) return;

    const submitBtn = document.getElementById(config.submitId);
    const leadIdInput = document.getElementById(
      config.leadIdFieldId
    );

    let started = false;

    form.addEventListener("input", function () {
      if (!started) {
        started = true;

        track("form_start", {
          form_name: config.formName
        });
      }
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      let valid = true;

      config.fields.forEach(function (field) {
        setError(field, "");
      });

      config.requiredFields.forEach(function (fieldId) {
        const el = document.getElementById(fieldId);

        if (el && !el.value.trim()) {
          setError(
            fieldId,
            "This field is required."
          );

          valid = false;
        }
      });

      const mobileEl = document.getElementById(
        config.mobileFieldId
      );

      if (
        mobileEl &&
        mobileEl.value.trim() &&
        !isValidIndianMobile(mobileEl.value)
      ) {
        setError(
          config.mobileFieldId,
          "Enter a valid 10-digit mobile number."
        );

        valid = false;
      }

      if (config.dateFieldId) {
        const dateEl = document.getElementById(
          config.dateFieldId
        );

        if (dateEl && dateEl.value) {
          const chosen = new Date(
            dateEl.value + "T00:00:00"
          );

          const today = new Date();

          today.setHours(0, 0, 0, 0);

          if (chosen < today) {
            setError(
              config.dateFieldId,
              "Please choose today or a future date."
            );

            valid = false;
          }
        }
      }

      if (!valid) return;

      const leadId = generateLeadId();

      if (leadIdInput) {
        leadIdInput.value = leadId;
      }

      if (submitBtn) {
        submitBtn.disabled = true;

        const label = submitBtn.querySelector(
          ".btn-label"
        );

        if (label) {
          label.style.visibility = "hidden";
        }

        const spinner = submitBtn.querySelector(
          ".btn-spinner"
        );

        if (spinner) {
          spinner.hidden = false;
        }
      }

      const payload = buildLeadPayload(
        form,
        leadId
      );

      sendLead(payload).then(function () {
        track("generate_lead", {
          lead_id: leadId,
          form_name: config.formName,
          requirement: payload.requirement || "",
          budget: payload.budget || "",
          property: payload.property || ""
        });

        if (config.formName === "book_site_visit") {
          track("site_visit_request", {
            lead_id: leadId
          });

          fireGoogleAdsConversion(
            CONFIG.googleAdsConversionLabel,
            {
              value: 1,
              currency: "INR"
            }
          );
        } else {
          fireGoogleAdsConversion(
            CONFIG.googleAdsConversionLabel,
            {
              value: 1,
              currency: "INR"
            }
          );
        }

        if (submitBtn) {
          submitBtn.disabled = false;

          const label = submitBtn.querySelector(
            ".btn-label"
          );

          if (label) {
            label.style.visibility = "visible";
          }

          const spinner = submitBtn.querySelector(
            ".btn-spinner"
          );

          if (spinner) {
            spinner.hidden = true;
          }
        }

        form.reset();
        showThankYou();
      });
    });
  }

  handleFormSubmit({
    formId: "leadForm",
    submitId: "lf-submit",
    leadIdFieldId: "lf-lead-id",
    mobileFieldId: "lf-mobile",
    formName: "get_property_details",
    fields: [
      "lf-name",
      "lf-mobile",
      "lf-requirement",
      "lf-budget"
    ],
    requiredFields: [
      "lf-name",
      "lf-mobile",
      "lf-requirement",
      "lf-budget"
    ]
  });

  handleFormSubmit({
    formId: "visitForm",
    submitId: "sv-submit",
    leadIdFieldId: "sv-lead-id",
    mobileFieldId: "sv-mobile",
    dateFieldId: "sv-date",
    formName: "book_site_visit",
    fields: [
      "sv-name",
      "sv-mobile",
      "sv-date",
      "sv-time"
    ],
    requiredFields: [
      "sv-name",
      "sv-mobile",
      "sv-date",
      "sv-time"
    ]
  });

  /* Enquire Now buttons on property cards scroll to and pre-fill the lead form */
  document.querySelectorAll(".js-enquire").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const property = btn.getAttribute(
        "data-property"
      );

      track("view_property", {
        property: property
      });

      const target = document.getElementById(
        "lead-form"
      );

      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }

      const nameField = document.getElementById(
        "lf-name"
      );

      if (nameField) {
        setTimeout(function () {
          nameField.focus();
        }, 500);
      }
    });
  });

  /* ------------------------------------------------------------------------
     6. LOCATION MAP + GET DIRECTIONS
     ------------------------------------------------------------------------ */
  const mapFrame = document.getElementById(
    "locationMap"
  );

  if (mapFrame) {
    if (CONFIG.mapEmbedUrl) {
      mapFrame.src = CONFIG.mapEmbedUrl;
    } else {
      mapFrame.style.display = "none";

      const parent = mapFrame.parentElement;

      if (parent) {
        parent.style.display = "flex";
        parent.style.alignItems = "center";
        parent.style.justifyContent = "center";

        parent.innerHTML +=
          '<p style="color:#55677a;font-size:0.9rem;padding:20px;text-align:center;">Map will appear here once CONFIG.mapEmbedUrl is set in script.js.</p>';
      }
    }
  }

  const directionsBtn = document.getElementById(
    "getDirectionsBtn"
  );

  if (directionsBtn) {
    directionsBtn.setAttribute(
      "href",
      CONFIG.directionsUrl
    );
  }

  /* ------------------------------------------------------------------------
     7. FAQ ACCORDION
     ------------------------------------------------------------------------ */
  document.querySelectorAll(".accordion-trigger").forEach(function (trigger) {
    trigger.addEventListener("click", function () {
      const expanded =
        trigger.getAttribute("aria-expanded") === "true";

      const panel = trigger
        .closest(".accordion-item")
        .querySelector(".accordion-panel");

      trigger.setAttribute(
        "aria-expanded",
        String(!expanded)
      );

      if (panel) {
        panel.hidden = expanded;
      }
    });
  });

  /* ------------------------------------------------------------------------
     8. GALLERY LIGHTBOX
     ------------------------------------------------------------------------ */
  const galleryItems = Array.prototype.slice.call(
    document.querySelectorAll(".gallery-item")
  );

  const lightbox = document.getElementById(
    "lightbox"
  );

  const lightboxImg = document.getElementById(
    "lightboxImg"
  );

  let currentGalleryIndex = 0;

  function openLightbox(index) {
    if (!lightbox || !galleryItems.length) return;

    currentGalleryIndex = index;

    const img = galleryItems[index].querySelector(
      "img"
    );

    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;

    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    if (!lightbox) return;

    lightbox.hidden = true;
    document.body.style.overflow = "";
  }

  function showNext(delta) {
    currentGalleryIndex =
      (currentGalleryIndex +
        delta +
        galleryItems.length) %
      galleryItems.length;

    const img = galleryItems[
      currentGalleryIndex
    ].querySelector("img");

    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
  }

  galleryItems.forEach(function (item, index) {
    item.addEventListener("click", function () {
      openLightbox(index);
    });
  });

  const lightboxClose = document.getElementById(
    "lightboxClose"
  );

  const lightboxPrev = document.getElementById(
    "lightboxPrev"
  );

  const lightboxNext = document.getElementById(
    "lightboxNext"
  );

  if (lightboxClose) {
    lightboxClose.addEventListener(
      "click",
      closeLightbox
    );
  }

  if (lightboxPrev) {
    lightboxPrev.addEventListener(
      "click",
      function () {
        showNext(-1);
      }
    );
  }

  if (lightboxNext) {
    lightboxNext.addEventListener(
      "click",
      function () {
        showNext(1);
      }
    );
  }

  if (lightbox) {
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) {
        closeLightbox();
      }
    });
  }

  document.addEventListener("keydown", function (e) {
    if (!lightbox || lightbox.hidden) return;

    if (e.key === "Escape") {
      closeLightbox();
    }

    if (e.key === "ArrowLeft") {
      showNext(-1);
    }

    if (e.key === "ArrowRight") {
      showNext(1);
    }
  });

  /* ------------------------------------------------------------------------
     9. SCROLL REVEAL
     ------------------------------------------------------------------------ */
  document
    .querySelectorAll(".section > .container > *")
    .forEach(function (el) {
      el.classList.add("reveal");
    });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add(
              "is-visible"
            );

            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12
      }
    );

    document
      .querySelectorAll(".reveal")
      .forEach(function (el) {
        observer.observe(el);
      });
  } else {
    document
      .querySelectorAll(".reveal")
      .forEach(function (el) {
        el.classList.add("is-visible");
      });
  }

  /* ------------------------------------------------------------------------
     10. MINIMUM DATE FOR SITE VISIT
     ------------------------------------------------------------------------ */
  const svDate = document.getElementById(
    "sv-date"
  );

  if (svDate) {
    const today = new Date();

    svDate.min = today
      .toISOString()
      .split("T")[0];
  }

  /* ------------------------------------------------------------------------
     11. FOOTER YEAR
     ------------------------------------------------------------------------ */
  const footerYear = document.getElementById(
    "footerYear"
  );

  if (footerYear) {
    footerYear.textContent =
      new Date().getFullYear();
  }

})();