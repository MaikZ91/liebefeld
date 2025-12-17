import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'event';
  event?: {
    name: string;
    startDate: string;
    endDate?: string;
    location: string;
    description?: string;
    image?: string;
  };
}

export const SEO = ({
  title = 'THE TRIBE Bielefeld | Events, Veranstaltungen & Community',
  description = 'Entdecke alle Events und Veranstaltungen in Bielefeld. Party, Konzerte, Sport, Kultur & mehr. Die #1 Community-App für Bielefeld.',
  keywords = 'Bielefeld Events, Veranstaltungen Bielefeld, Party Bielefeld, Konzerte Bielefeld, THE TRIBE',
  image = 'https://the-tribe.bi/og-image.png',
  url = 'https://the-tribe.bi/',
  type = 'website',
  event,
}: SEOProps) => {
  const fullTitle = title.includes('THE TRIBE') ? title : `${title} | THE TRIBE Bielefeld`;

  return (
    <Helmet>
      {/* Basic Meta */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      
      {/* Twitter */}
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Canonical */}
      <link rel="canonical" href={url} />
      
      {/* Event Schema if provided */}
      {event && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Event",
            "name": event.name,
            "startDate": event.startDate,
            "endDate": event.endDate || event.startDate,
            "location": {
              "@type": "Place",
              "name": event.location,
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Bielefeld",
                "addressCountry": "DE"
              }
            },
            "description": event.description || `${event.name} in Bielefeld`,
            "image": event.image || image,
            "organizer": {
              "@type": "Organization",
              "name": "THE TRIBE Bielefeld",
              "url": "https://the-tribe.bi"
            },
            "eventStatus": "https://schema.org/EventScheduled",
            "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode"
          })}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
