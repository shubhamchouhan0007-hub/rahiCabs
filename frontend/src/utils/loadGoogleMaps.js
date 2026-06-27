let loadPromise = null;

export function loadGoogleMaps(apiKey) {
  if (window.google?.maps?.places) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => { loadPromise = null; reject(new Error('Google Maps failed to load')); };
    document.head.appendChild(script);
  });

  return loadPromise;
}
