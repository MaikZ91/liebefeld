
declare module 'leaflet.heat' {
  import * as L from 'leaflet';
  
  namespace L {
    interface HeatLatLngTuple extends Array<number> {
      0: number; // latitude
      1: number; // longitude  
      2?: number; // intensity (optional)
    }

    interface HeatMapOptions {
      minOpacity?: number;
      maxZoom?: number;
      max?: number;
      radius?: number;
      blur?: number;
      gradient?: { [key: number]: string };
    }

    function heatLayer(
      latlngs: HeatLatLngTuple[], 
      options?: HeatMapOptions
    ): L.Layer;
  }
}
