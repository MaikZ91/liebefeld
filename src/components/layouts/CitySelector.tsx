
import React from 'react';
import CitySearchField from '../CitySearchField';
import { useEventContext } from '@/contexts/EventContext';

const CitySelector: React.FC = () => {
  const { selectedCity, setSelectedCity } = useEventContext();

  const handleCitySelect = (city: string) => {
    // Normalisiere Stadt zu Abkürzung für interne Verwendung
    const cityAbbr = city.toLowerCase().replace(/[^a-z]/g, '');
    setSelectedCity(cityAbbr);
  };

  // Zeige den vollständigen Stadtnamen an
  const displayCity = selectedCity === 'bi' ? 'Bielefeld' : 
    selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1);

  return (
    <CitySearchField 
      onCitySelect={handleCitySelect}
      currentCity={displayCity}
    />
  );
};

export default CitySelector;
