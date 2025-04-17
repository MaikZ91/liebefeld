
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

export const getActivitySuggestions = (
  timeOfDay: 'morning' | 'afternoon' | 'evening', 
  interest: string, 
  weather: string
): string[] => {
  // This is a simplified version, in a real app this would use more sophisticated 
  // logic or a backend AI service to generate personalized recommendations
  
  const suggestions: Record<string, Record<string, Record<string, string[]>>> = {
    morning: {
      sunny: {
        'Ausgehen': [
          'Frühstück auf der Terrasse vom Café Milchladen',
          'Bummeln durch den Wochenmarkt auf dem Alten Markt',
          'Kaffee im Freien in der Altstadt'
        ],
        'Sport': [
          'Joggen im Stadtpark',
          'Yoga im Bürgerpark unter freiem Himmel',
          'Tennisspielen auf den Außenplätzen'
        ],
        'Kreativität': [
          'Outdoor-Fotografie im Teutoburger Wald',
          'Malkurs im Botanischen Garten',
          'Open-Air-Ausstellung in der Kunsthalle'
        ]
      },
      cloudy: {
        'Ausgehen': [
          'Gemütliches Frühstück im Lieblings-Café',
          'Besuch der Stadtbibliothek',
          'Shopping-Tour durch die Bahnhofstraße'
        ],
        'Sport': [
          'Besuch im Fitnessstudio',
          'Schwimmen im Ishara',
          'Indoor-Klettern im Kletterpark'
        ],
        'Kreativität': [
          'Workshop im Kulturzentrum',
          'Besuch der Kunsthalle Bielefeld',
          'Kreativer Schreibkurs in der VHS'
        ]
      }
    },
    afternoon: {
      sunny: {
        'Ausgehen': [
          'Eis essen in der Altstadt',
          'Spaziergang durch den Tierpark Olderdissen',
          'Kaffee & Kuchen im Parkgarten'
        ],
        'Sport': [
          'Radtour zum Obersee',
          'Beach-Volleyball im Bürgerpark',
          'Stand-Up-Paddling auf dem Obersee'
        ],
        'Kreativität': [
          'Urban Sketching in der Altstadt',
          'Besuch der Kunstgalerie Atelier D',
          'Fotospaziergang durch die Ravensberger Spinnerei'
        ]
      },
      cloudy: {
        'Ausgehen': [
          'Besuch im Historischen Museum',
          'Kaffeetrinken im gemütlichen Café Kaffeesatz',
          'Shopping in der City'
        ],
        'Sport': [
          'Bouldern im Climbingspot',
          'Badminton in der Sporthalle',
          'Bowlen im Strike'
        ],
        'Kreativität': [
          'Besuch des Naturkundemuseums',
          'Töpferkurs in der Kreativwerkstatt',
          'Gitarrenstunde in der Musikschule'
        ]
      }
    },
    evening: {
      sunny: {
        'Ausgehen': [
          'Sonnenuntergang auf der Sparrenburg genießen',
          'Open-Air-Konzert im Ravensberger Park',
          'Cocktails im Biergarten der Alm'
        ],
        'Sport': [
          'Abendlicher Beachvolleyball im Sportpark',
          'Feierabend-Laufrunde um den Obersee',
          'Outdoor-Yoga im Park'
        ],
        'Kreativität': [
          'Offene Bühne im Bunker Ulmenwall',
          'Outdoor-Kinoabend im Ravensberger Park',
          'Theateraufführung unter freiem Himmel'
        ]
      },
      cloudy: {
        'Ausgehen': [
          'Konzert im Forum',
          'Kinobesuch im Lichtwerk',
          'Cocktails in der Neustadt'
        ],
        'Sport': [
          'Abendschwimmen im Hallenbad',
          'Indoor-Fußball in der Soccerhalle',
          'Fitnesskurs im Studio'
        ],
        'Kreativität': [
          'Theater im TAM',
          'Improvisationstheater im Alarmtheater',
          'Jazzabend im Bunker Ulmenwall'
        ]
      }
    }
  };
  
  // Map the weather to our simplified categories
  const mappedWeather = weather === 'sunny' ? 'sunny' : 'cloudy';
  
  // Return suggestions or default if not found
  try {
    return suggestions[timeOfDay][mappedWeather][interest] || [
      'Entdecke Bielefeld auf eigene Faust!',
      'Frag den Chatbot nach persönlichen Empfehlungen.'
    ];
  } catch (error) {
    return [
      'Entdecke Bielefeld auf eigene Faust!',
      'Frag den Chatbot nach persönlichen Empfehlungen.'
    ];
  }
};

