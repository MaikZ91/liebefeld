// src/components/layouts/CitySelector.tsx
import React from 'react';
import CitySearchField from '../CitySearchField';
import { useEventContext, cities } from '@/contexts/EventContext'; // Import cities

const CitySelector: React.FC = () => {
  const { selectedCity, setSelectedCity } = useEventContext(); //

  const handleCitySelect = (cityName: string) => {
    // Finde das Stadtobjekt (z.B. { name: "Bielefeld", abbr: "BI" }) in der 'cities'-Liste
    const cityObject = cities.find(c => c.name.toLowerCase() === cityName.toLowerCase()); //
    
    // Setze selectedCity auf die Abkürzung (z.B. 'BI'), falls gefunden.
    // Falls nicht gefunden (z.B. bei manueller Eingabe einer neuen Stadt),
    // wird der normalisierte (kleingeschriebene, bereinigte) Name verwendet.
    // Die Funktion createCitySpecificGroupId erwartet die Abkürzung.
    const cityAbbr = cityObject ? cityObject.abbr : cityName.toLowerCase().replace(/[^a-z]/g, ''); //
    
    setSelectedCity(cityAbbr); //
  };

  // Der 'displayCity' Wert für das Suchfeld wird weiterhin der volle Name sein.
  // Find the full city name using the stored abbreviation, or fallback to the abbreviation itself if not found.
  const displayCity = cities.find(c => c.abbr.toLowerCase() === selectedCity.toLowerCase())?.name || selectedCity; //

  return (
    <CitySearchField 
      onCitySelect={handleCitySelect}
      currentCity={displayCity}
    />
  );
};

export default CitySelector;