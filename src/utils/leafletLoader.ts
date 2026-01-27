// Dynamic Leaflet loader - only loads when map is actually needed
let leafletLoaded = false;
let loadingPromise: Promise<void> | null = null;

export const loadLeaflet = (): Promise<void> => {
  if (leafletLoaded) return Promise.resolve();
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise((resolve, reject) => {
    // Load CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    link.crossOrigin = '';
    document.head.appendChild(link);

    // Load main Leaflet script
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin = '';
    
    script.onload = () => {
      // Load heat plugin after main Leaflet
      const heatScript = document.createElement('script');
      heatScript.src = 'https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js';
      heatScript.onload = () => {
        leafletLoaded = true;
        resolve();
      };
      heatScript.onerror = reject;
      document.head.appendChild(heatScript);
    };
    
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return loadingPromise;
};

export const isLeafletLoaded = () => leafletLoaded;
