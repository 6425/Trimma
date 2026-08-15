const BANNER_SCRIPT = `
(function () {
  var root = document.getElementById("trimma-cookie-banner");
  if (!root) return;
  var prefsPanel = document.getElementById("trimma-cookie-prefs");
  var key = "trimma-cookie-consent";
  var locKey = "trimma-device-location";

  function show() {
    root.style.display = "flex";
    document.documentElement.style.overflow = "hidden";
  }
  function hide() {
    root.style.display = "none";
    document.documentElement.style.overflow = "";
  }
  function save(prefs) {
    try {
      localStorage.setItem(key, JSON.stringify({
        essential: true,
        analytics: !!prefs.analytics,
        functional: !!prefs.functional,
        marketing: !!prefs.marketing,
        location: !!prefs.location,
        version: 4,
        updatedAt: new Date().toISOString()
      }));
      window.dispatchEvent(new CustomEvent("trimma-cookie-consent-updated"));
    } catch (e) {}
  }
  function requestGps() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(function (pos) {
      try {
        sessionStorage.setItem(locKey, JSON.stringify({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          at: Date.now()
        }));
        window.dispatchEvent(new CustomEvent("trimma-device-location-updated"));
      } catch (e) {}
    }, function () {}, { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 });
  }
  function readChecks() {
    return {
      analytics: !!document.getElementById("trimma-cookie-analytics")?.checked,
      functional: !!document.getElementById("trimma-cookie-functional")?.checked,
      marketing: !!document.getElementById("trimma-cookie-marketing")?.checked,
      location: !!document.getElementById("trimma-cookie-location")?.checked
    };
  }

  show();

  root.querySelector("[data-cookie-action=manage]")?.addEventListener("click", function () {
    if (prefsPanel) prefsPanel.hidden = false;
  });
  root.querySelector("[data-cookie-action=back]")?.addEventListener("click", function () {
    if (prefsPanel) prefsPanel.hidden = true;
  });
  root.querySelector("[data-cookie-action=essential]")?.addEventListener("click", function () {
    save({ analytics: false, functional: false, marketing: false, location: false });
    hide();
  });
  root.querySelector("[data-cookie-action=accept]")?.addEventListener("click", function () {
    save({ analytics: true, functional: true, marketing: true, location: true });
    requestGps();
    hide();
  });
  root.querySelector("[data-cookie-action=save]")?.addEventListener("click", function () {
    var prefs = readChecks();
    save(prefs);
    if (prefs.location) requestGps();
    hide();
  });

  window.addEventListener("trimma-cookie-consent-updated", function () {
    try {
      if (!localStorage.getItem(key)) {
        if (prefsPanel) prefsPanel.hidden = false;
        show();
      }
    } catch (e) {}
  });
})();
`;

export function CookieConsentBanner() {
  return (
    <>
      <div
        id="trimma-cookie-banner"
        data-trimma-cookie-banner="v4"
        className="fixed inset-0 z-[2147483647] flex items-end justify-center bg-black/50 p-4 sm:items-center sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-consent-title"
        aria-describedby="cookie-consent-description"
      >
        <div className="w-full max-w-4xl rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#ffde5a]/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-yellow-700">
                <span className="h-1.5 w-1.5 rounded-full bg-[#ffde5a]" />
                Cookie preferences
              </p>
              <h2 id="cookie-consent-title" className="text-lg font-extrabold text-zinc-900">
                Cookies, privacy, and optional location
              </h2>
              <p id="cookie-consent-description" className="mt-2 text-sm leading-6 text-zinc-600">
                We use cookies to operate Trimma and keep your session secure. To show accurate search
                and map information — including distance and the fastest way to reach a business — we
                can use your device location if you enable GPS. Location is optional and is not used
                for advertising. Essential cookies stay on.{" "}
                <a href="/cookies" className="font-semibold text-zinc-900 underline decoration-[#ffde5a] decoration-2 underline-offset-4">
                  Cookie Policy
                </a>
                {" "}and{" "}
                <a href="/privacy-policy" className="font-semibold text-zinc-900 underline decoration-[#ffde5a] decoration-2 underline-offset-4">
                  Privacy Policy
                </a>
                .
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end">
              <button
                type="button"
                data-cookie-action="manage"
                className="h-11 min-h-11 rounded-xl border border-zinc-200 px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
              >
                Manage preferences
              </button>
              <button
                type="button"
                data-cookie-action="essential"
                className="h-11 min-h-11 rounded-xl border border-zinc-200 px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
              >
                Essential only
              </button>
              <button
                type="button"
                data-cookie-action="accept"
                className="h-11 min-h-11 rounded-xl bg-zinc-900 px-4 text-sm font-bold text-white hover:bg-zinc-800 hover:text-[#ffde5a]"
              >
                Accept all
              </button>
            </div>
          </div>

          <div id="trimma-cookie-prefs" hidden className="mt-5 border-t border-zinc-100 pt-5">
            <div className="max-h-[50vh] space-y-3 overflow-y-auto">
              <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                <p className="text-sm font-semibold text-zinc-900">Essential cookies</p>
                <p className="mt-1 text-sm text-zinc-600">
                  Required for sign-in, sessions, security, and core booking flows. Always active.
                </p>
              </div>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-100 p-4">
                <input id="trimma-cookie-analytics" type="checkbox" className="mt-1 h-4 w-4" />
                <span>
                  <span className="block text-sm font-semibold text-zinc-900">Performance & analytics</span>
                  <span className="mt-1 block text-sm text-zinc-600">Help us measure and improve how Trimma works.</span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-100 p-4">
                <input id="trimma-cookie-functional" type="checkbox" className="mt-1 h-4 w-4" />
                <span>
                  <span className="block text-sm font-semibold text-zinc-900">Functional</span>
                  <span className="mt-1 block text-sm text-zinc-600">Remember preferences such as language and saved salons.</span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-100 p-4">
                <input id="trimma-cookie-location" type="checkbox" defaultChecked className="mt-1 h-4 w-4" />
                <span>
                  <span className="block text-sm font-semibold text-zinc-900">Device location</span>
                  <span className="mt-1 block text-sm text-zinc-600">
                    Optional GPS for accurate distance, travel time, and routes. Your browser will still ask to confirm.
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-100 p-4">
                <input id="trimma-cookie-marketing" type="checkbox" className="mt-1 h-4 w-4" />
                <span>
                  <span className="block text-sm font-semibold text-zinc-900">Marketing</span>
                  <span className="mt-1 block text-sm text-zinc-600">Show relevant offers and measure campaign effectiveness.</span>
                </span>
              </label>
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                data-cookie-action="back"
                className="h-11 min-h-11 rounded-xl border border-zinc-200 px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
              >
                Back
              </button>
              <button
                type="button"
                data-cookie-action="save"
                className="h-11 min-h-11 rounded-xl bg-[#ffde5a] px-4 text-sm font-bold text-zinc-900 hover:bg-[#ffe680]"
              >
                Save preferences
              </button>
            </div>
          </div>
        </div>
      </div>
      <script dangerouslySetInnerHTML={{ __html: BANNER_SCRIPT }} />
    </>
  );
}
