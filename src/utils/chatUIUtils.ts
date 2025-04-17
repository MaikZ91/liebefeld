
export const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase();
};

export const getRandomAvatar = () => {
  const seed = Math.random().toString(36).substring(2, 8);
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
};

export const getCategoryColor = (category: string): string => {
  const categoryColors: Record<string, string> = {
    'Ausgehen': 'bg-purple-500 text-white hover:bg-purple-600',
    'Sport': 'bg-green-500 text-white hover:bg-green-600',
    'Kreativität': 'bg-amber-500 text-white hover:bg-amber-600',
    'default': 'bg-gray-200 text-gray-800 hover:bg-gray-300'
  };
  
  return categoryColors[category] || categoryColors.default;
};

// Enhanced recommendation system with more specific activities for Bielefeld
export const getActivitySuggestions = (
  timeOfDay: 'morning' | 'afternoon' | 'evening', 
  interest: string, 
  weather: string
): string[] => {
  // Expanded suggestion database with more Bielefeld-specific activities
  const suggestions: Record<string, Record<string, Record<string, string[]>>> = {
    morning: {
      sunny: {
        'Ausgehen': [
          'Frühstück auf der Terrasse vom Café Milchladen',
          'Bummeln durch den Wochenmarkt auf dem Alten Markt',
          'Kaffee im Freien in der Altstadt',
          'Brunch im Bernhard Kaffeehaus in der Stapenhorststraße',
          'Besuch des Bauernhofcafés in Jöllenbeck',
          'Frühstück im Lieblingscafé im Babenhausener Viertel'
        ],
        'Sport': [
          'Joggen im Stadtpark',
          'Yoga im Bürgerpark unter freiem Himmel',
          'Tennisspielen auf den Außenplätzen',
          'Morgendliches Training im Calisthenics-Park',
          'Radtour durch den Teutoburger Wald',
          'Wanderung zum Hermannsturm',
          'Klettern an der Sparrenburg'
        ],
        'Kreativität': [
          'Outdoor-Fotografie im Teutoburger Wald',
          'Malkurs im Botanischen Garten',
          'Open-Air-Ausstellung in der Kunsthalle',
          'Skizzen zeichnen auf der Promenade',
          'Kreatives Schreiben im Ravensberger Park',
          'Besuch des Historischen Museums bei Morgenlicht',
          'Fotografieren der historischen Fassaden in der Altstadt'
        ]
      },
      cloudy: {
        'Ausgehen': [
          'Gemütliches Frühstück im Lieblings-Café',
          'Besuch der Stadtbibliothek',
          'Shopping-Tour durch die Bahnhofstraße',
          'Besuch der überdachten Markthalle am Siegfriedplatz',
          'Brunch im Café Kaffeehaus in der Arndstraße',
          'Entdeckung der kleinen Geschäfte in der Altstadt'
        ],
        'Sport': [
          'Besuch im Fitnessstudio',
          'Schwimmen im Ishara',
          'Indoor-Klettern im Kletterpark',
          'Squash-Partie im Sportcenter',
          'Indoor-Cycling-Kurs in der Fitnesslounge',
          'Training im DAV-Kletterzentrum'
        ],
        'Kreativität': [
          'Workshop im Kulturzentrum',
          'Besuch der Kunsthalle Bielefeld',
          'Kreativer Schreibkurs in der VHS',
          'Töpfern in der Kreativwerkstatt Bielefeld',
          'Besuch des Bauernhausmuseums',
          'Ausstellung im Bunker Ulmenwall anschauen',
          'Besuch der Stadtbibliothek für neue Inspirationen'
        ]
      }
    },
    afternoon: {
      sunny: {
        'Ausgehen': [
          'Eis essen in der Altstadt',
          'Spaziergang durch den Tierpark Olderdissen',
          'Kaffee & Kuchen im Parkgarten',
          'Picknick im Bürgerpark',
          'Entspannen auf der Wiese im Nordpark',
          'Bummel durch die Einkaufszone in der Bahnhofstraße',
          'Eisbecher genießen in der Eisdiele Gelato Leonardo'
        ],
        'Sport': [
          'Radtour zum Obersee',
          'Beach-Volleyball im Bürgerpark',
          'Stand-Up-Paddling auf dem Obersee',
          'Bogenschießen im Sportpark',
          'Fahrradfahren auf dem Radweg zum Johannisberg',
          'Wassersport am Brackweder Badesee',
          'Tischtennis spielen im Heeper Park'
        ],
        'Kreativität': [
          'Urban Sketching in der Altstadt',
          'Besuch der Kunstgalerie Atelier D',
          'Fotospaziergang durch die Ravensberger Spinnerei',
          'Malen im Botanischen Garten',
          'Fotografieren der historischen Architektur',
          'Besuch der Kunstausstellung im GAK',
          'Kreative Workshops im Kulturamt besuchen'
        ]
      },
      cloudy: {
        'Ausgehen': [
          'Besuch im Historischen Museum',
          'Kaffeetrinken im gemütlichen Café Kaffeesatz',
          'Shopping in der City',
          'Schaufensterbummel auf dem Jahnplatz',
          'Fünf-Uhr-Tee im Teesalon Classique',
          'Kuchen essen im Kachelhaus am Alten Markt',
          'Besichtigung der Neustädter Marienkirche'
        ],
        'Sport': [
          'Bouldern im Climbingspot',
          'Badminton in der Sporthalle',
          'Bowlen im Strike',
          'Fitnesskurs im McFit Bielefeld',
          'Indoor-Cycling im Sportclub',
          'Tischtennis in der Sporthalle Gadderbaum',
          'Pilates oder Yoga im Studio Lichtblick'
        ],
        'Kreativität': [
          'Besuch des Naturkundemuseums',
          'Töpferkurs in der Kreativwerkstatt',
          'Gitarrenstunde in der Musikschule',
          'Kreatives Nähen im Nähcafé',
          'Workshop im Haus der Technik besuchen',
          'Proben mit der Theatergruppe im Theaterlabor',
          'Besuch der aktuellen Ausstellung in der Galerie Samuelis Baumgarte'
        ]
      }
    },
    evening: {
      sunny: {
        'Ausgehen': [
          'Sonnenuntergang auf der Sparrenburg genießen',
          'Open-Air-Konzert im Ravensberger Park',
          'Cocktails im Biergarten der Alm',
          'Drink auf der Dachterrasse des Légère Hotel',
          'Besuch der Strandbar am Obersee',
          'Abendliches Dinieren im Restaurant Glück und Seligkeit',
          'Foodtrucks am Kesselbrink besuchen'
        ],
        'Sport': [
          'Abendlicher Beachvolleyball im Sportpark',
          'Feierabend-Laufrunde um den Obersee',
          'Outdoor-Yoga im Park',
          'Joggen auf der beleuchteten Promenade',
          'Basketball auf dem Freiplatz am Kesselbrink',
          'Fahrradfahren durch den abendlichen Stadtpark',
          'Skaten im Skatepark Kesselbrink'
        ],
        'Kreativität': [
          'Offene Bühne im Bunker Ulmenwall',
          'Outdoor-Kinoabend im Ravensberger Park',
          'Theateraufführung unter freiem Himmel',
          'Abendliche Fotoexpedition zum Sonnenuntergang',
          'Musik-Session im Welthaus Bielefeld',
          'Konzertbesuch im Forum',
          'Gitarre spielen am Obersee beim Sonnenuntergang'
        ]
      },
      cloudy: {
        'Ausgehen': [
          'Konzert im Forum',
          'Kinobesuch im Lichtwerk',
          'Cocktails in der Neustadt',
          'Abendessen im Restaurant Glück und Seligkeit',
          'Dinieren im georgischen Restaurant Tamada',
          'Bier probieren in der Bielefelder Braumanufaktur',
          'Weinprobe im Weinkontor Glück'
        ],
        'Sport': [
          'Abendschwimmen im Hallenbad',
          'Indoor-Fußball in der Soccerhalle',
          'Fitnesskurs im Studio',
          'Boxtraining im Boxclub',
          'Tanzunterricht in der Tanzschule',
          'Krafttraining im 24/7 Studio',
          'Badminton in der Sporthalle Heepen'
        ],
        'Kreativität': [
          'Theater im TAM',
          'Improvisationstheater im Alarmtheater',
          'Jazzabend im Bunker Ulmenwall',
          'Literaturlesung im Literaturbüro OWL',
          'Workshop im Kulturzentrum Nummer zu klein',
          'Filmabend im Kamera Filmkunsttheater',
          'Kunstausstellung in der Galerie Artists Unlimited'
        ]
      }
    }
  };
  
  // Map the weather to our simplified categories
  const mappedWeather = weather === 'sunny' ? 'sunny' : 'cloudy';
  
  // Get all suggestions for the selected parameters
  try {
    const allSuggestions = suggestions[timeOfDay][mappedWeather][interest] || [
      'Entdecke Bielefeld auf eigene Faust!',
      'Spaziergang durch die wunderschöne Altstadt von Bielefeld',
      'Besuche das Heimatmuseum in Bielefeld'
    ];
    
    // For random selection in case we want to implement "Show more" functionality later
    const shuffleArray = (array: string[]) => {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    };
    
    // Return shuffled suggestions
    return shuffleArray([...allSuggestions]);
  } catch (error) {
    return [
      'Entdecke Bielefeld auf eigene Faust!',
      'Spaziergang durch die wunderschöne Altstadt von Bielefeld',
      'Besuche das Heimatmuseum in Bielefeld'
    ];
  }
};

