import { TribeApp } from '@/components/tribe/TribeApp';
import SEO from '@/components/SEO';

const Tribe = () => {
  return (
    <>
      <SEO 
        title="Events & Veranstaltungen Bielefeld | THE TRIBE"
        description="Entdecke alle Events in Bielefeld: Party, Konzerte, Sport, Kultur. Personalisierte Empfehlungen durch KI-Assistentin MIA. Die #1 Community-App für Bielefeld."
        keywords="Bielefeld Events, Veranstaltungen Bielefeld, Party Bielefeld, Konzerte Bielefeld, Sport Bielefeld, Kultur Bielefeld, Was geht in Bielefeld, Events heute, Bielefeld Wochenende, THE TRIBE, MIA, Event App Bielefeld"
        url="https://the-tribe.bi/tribe"
      />
      <TribeApp />
    </>
  );
};

export default Tribe;
