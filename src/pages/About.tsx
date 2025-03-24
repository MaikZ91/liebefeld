
import React, { useEffect } from 'react';
import CalendarNavbar from '@/components/CalendarNavbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BadgeCheck, Calendar, Clock, Heart, Link, Mail, MapPin, MessageSquare, SendIcon, Users } from 'lucide-react';
import ImageCarousel from '@/components/ImageCarousel';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const About = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  
  const { toast } = useToast();
  
  // Community images for the carousel - same as on index page
  const communityImages = [
    {
      src: "/lovable-uploads/c38064ee-a32f-4ecc-b148-f9c53c28d472.png",
      alt: "Music session with the community"
    },
    {
      src: "/lovable-uploads/8562fff2-2b62-4552-902b-cc62457a3402.png",
      alt: "Electric Circle Vol.3 DJ session"
    },
    {
      src: "/lovable-uploads/2653c557-0afe-4690-9d23-0b523cb09e3e.png",
      alt: "Tribe Stammtisch community gathering"
    },
    {
      src: "/lovable-uploads/e819d6a5-7715-4cb0-8f30-952438637b87.png",
      alt: "Music band session"
    }
  ];

  // Define the form schema with zod
  const formSchema = z.object({
    name: z.string().min(2, {
      message: "Name muss mindestens 2 Zeichen lang sein."
    }),
    email: z.string().email({
      message: "Bitte gib eine gültige E-Mail-Adresse ein."
    }),
    company: z.string().optional(),
    message: z.string().min(10, {
      message: "Nachricht muss mindestens 10 Zeichen lang sein."
    })
  });

  // Initialize the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      message: ""
    }
  });

  // Form submission handler
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // In a real implementation, you would send an email to maik.z@gmx.de
      // This is a simple simulation of a successful submission
      console.log("Form submitted:", values);
      
      // Show success toast
      toast({
        title: "Nachricht gesendet!",
        description: "Vielen Dank für deine Anfrage. Wir werden uns so schnell wie möglich bei dir melden.",
        variant: "default"
      });
      
      // Reset form
      form.reset();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Fehler beim Senden",
        description: "Es gab ein Problem beim Senden deiner Nachricht. Bitte versuche es später noch einmal.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <CalendarNavbar />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8 max-w-6xl animate-fade-in">
          <section className="mb-16">
            <div className="text-center mb-10">
              <span className="inline-block py-1 px-3 rounded-full bg-secondary text-sm font-medium mb-4">Über Uns</span>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">THE TRIBE.BI</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Wir verbinden Menschen im echten Leben und machen Bielefeld lebendiger!
              </p>
            </div>
          </section>
          
          <section className="mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-3">Unsere Mission</h2>
                    <p className="text-muted-foreground">
                      Wir möchten Bielefeld lebendiger gestalten, indem wir Menschen im echten Leben zusammenbringen. 
                      In einer Zeit, in der digitale Verbindungen oft unseren Alltag dominieren, schaffen wir 
                      Möglichkeiten für authentische Begegnungen, gemeinsame Erlebnisse und den Aufbau einer 
                      starken lokalen Gemeinschaft.
                    </p>
                  </div>
                  
                  <div>
                    <h2 className="text-2xl font-bold mb-3">Unsere Vision</h2>
                    <p className="text-muted-foreground">
                      Wir streben nach einer Stadt, in der Gemeinschaft wieder im Mittelpunkt steht. 
                      Eine Stadt, in der Menschen verschiedener Hintergründe und Interessen zusammenkommen, 
                      Ideen teilen und gemeinsam Bielefeld zu einem pulsierenden Ort machen. 
                      Unser Kalender ist mehr als eine Plattform – er ist eine Einladung, Teil dieser 
                      lebenswerten Gemeinschaft zu werden.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="order-1 md:order-2">
                <ImageCarousel images={communityImages} autoSlideInterval={6000} />
              </div>
            </div>
          </section>
          
          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Warum einen Community Kalender?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="glass-card hover-scale">
                  <CardContent className="p-6">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
          
          {/* Partner Section */}
          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Unsere Partner</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center bg-white/50 rounded-xl p-8 shadow-sm border border-white/30">
              <div>
                <h3 className="text-xl font-bold mb-4">Social Tides</h3>
                <p className="text-muted-foreground mb-4">
                  Wir werden durch Social Tides gefördert, um Bielefeld zu verbinden und lokale 
                  Gemeinschaften zu stärken. Mit ihrer Unterstützung schaffen wir neue Wege, 
                  um Menschen zusammenzubringen.
                </p>
                <Button variant="outline" className="rounded-full gap-2" asChild>
                  <a href="https://www.socialtides.eu/community/the-tribe.bi" target="_blank" rel="noopener noreferrer">
                    <Link className="h-4 w-4" />
                    Mehr erfahren
                  </a>
                </Button>
              </div>
              
              <div className="flex justify-center">
                <div className="glass-card p-6 rounded-xl hover-scale">
                  <img 
                    src="/lovable-uploads/764c9b33-5d7d-4134-b503-c77e23c469f9.png" 
                    alt="Social Tides Logo" 
                    className="max-h-40 object-contain"
                  />
                </div>
              </div>
            </div>
          </section>
          
          {/* Partnerships Section - Highlighted and modified to be more prominent */}
          <section className="mb-16 scroll-mt-24 relative" id="partnerships">
            <div className="absolute -inset-2 bg-gradient-to-r from-amber-300/20 via-orange-300/20 to-amber-300/20 rounded-3xl blur-xl"></div>
            
            <div className="glass-card bg-gradient-to-br from-orange-50/90 to-amber-50/90 dark:from-amber-950/40 dark:to-orange-900/30 rounded-2xl p-8 md:p-12 shadow-lg border-2 border-amber-300/50 dark:border-amber-600/40 relative">
              <div className="absolute top-0 right-0 w-40 h-40 bg-amber-300/20 rounded-full blur-2xl -mr-10 -mt-10 z-0"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-orange-300/20 rounded-full blur-2xl -ml-10 -mb-10 z-0"></div>
              
              <div className="relative z-10">
                <div className="inline-block px-4 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-100 font-medium text-sm mb-4">
                  Partnerschaften
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-transparent dark:from-amber-300 dark:to-orange-400">Gemeinsam Bielefeld gestalten</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                  <div>
                    <p className="text-muted-foreground mb-6 text-lg">
                      Wir sind ständig auf der Suche nach Partnerschaften mit lokalen Unternehmen und Initiativen, 
                      die unsere Vision für ein lebendigeres Bielefeld teilen. Ob du Events anbieten möchtest,
                      durch Sponsoring unterstützen oder andere Ideen hast – wir freuen uns auf deine Nachricht!
                    </p>
                    
                    <div className="space-y-5 mb-8">
                      <div className="flex items-start gap-3 bg-white/60 dark:bg-white/10 p-4 rounded-xl shadow-sm">
                        <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-800/30 flex items-center justify-center shrink-0 mt-1">
                          <BadgeCheck className="h-5 w-5 text-amber-600 dark:text-amber-300" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">Event-Hosting</h3>
                          <p className="text-muted-foreground">Nutze unsere Plattform, um deine eigenen Events zu bewerben und ein breites Publikum zu erreichen</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 bg-white/60 dark:bg-white/10 p-4 rounded-xl shadow-sm">
                        <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-800/30 flex items-center justify-center shrink-0 mt-1">
                          <BadgeCheck className="h-5 w-5 text-amber-600 dark:text-amber-300" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">Sponsoring</h3>
                          <p className="text-muted-foreground">Unterstütze kommende Community-Events durch Sponsoring und stelle dein Unternehmen vor</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 bg-white/60 dark:bg-white/10 p-4 rounded-xl shadow-sm">
                        <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-800/30 flex items-center justify-center shrink-0 mt-1">
                          <BadgeCheck className="h-5 w-5 text-amber-600 dark:text-amber-300" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">Lokale Kooperationen</h3>
                          <p className="text-muted-foreground">Gemeinsam erreichen wir mehr als allein - lass uns zusammen Bielefeld beleben</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                      <a href="mailto:maik.z@gmx.de" className="inline-flex items-center gap-2">
                        <Button variant="outline" className="rounded-full">
                          <Mail className="mr-2 h-4 w-4" /> maik.z@gmx.de
                        </Button>
                      </a>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-black/20 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-800">
                    <h3 className="text-xl font-bold mb-4">Kontaktiere uns</h3>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Dein Name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>E-Mail</FormLabel>
                              <FormControl>
                                <Input placeholder="deine.email@beispiel.de" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="company"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unternehmen/Organisation <span className="text-muted-foreground text-sm">(optional)</span></FormLabel>
                              <FormControl>
                                <Input placeholder="Dein Unternehmen" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="message"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nachricht</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Wie können wir zusammenarbeiten? Erzähl uns mehr über deine Idee..." 
                                  className="min-h-[120px]" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button type="submit" className="w-full gap-2">
                          <SendIcon className="h-4 w-4" /> Nachricht senden
                        </Button>
                      </form>
                    </Form>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          {/* Impressum Section */}
          <section id="impressum" className="mb-16">
            <div className="max-w-3xl mx-auto border rounded-lg p-6 bg-card">
              <h2 className="text-2xl font-bold mb-4">Impressum</h2>
              <div className="h-1 w-20 bg-primary/70 rounded mb-6"></div>
              <p className="text-muted-foreground mb-4">Gemäß § 5 TMG</p>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Angaben zum Betreiber</h3>
                  <div className="rounded-lg border p-4 bg-card/50">
                    <p className="font-medium">Maik Zschach</p>
                    <p>Merianstraße 8</p>
                    <p>33615 Bielefeld</p>
                    <p>Deutschland</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Kontakt</h3>
                  <div className="rounded-lg border p-4 bg-card/50">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      <p>mschach@googlemail.com</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Haftungsausschluss</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>
                      Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.
                    </p>
                    <p>
                      Als Diensteanbieter sind wir für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Wir sind jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
                    </p>
                    <p>
                      Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 text-sm text-muted-foreground">
                <p>Stand: {new Date().toLocaleDateString('de-CH')}</p>
              </div>
            </div>
          </section>
          
          <section className="text-center">
            <p className="text-muted-foreground">
              &copy; {new Date().getFullYear()} THE TRIBE.BI • Mit ♥ in Bielefeld erstellt
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

const features = [
  {
    title: "Echte Begegnungen",
    description: "Entdecke Veranstaltungen, die Menschen im echten Leben zusammenbringen und neue Freundschaften entstehen lassen.",
    icon: Calendar
  },
  {
    title: "Lokale Gemeinschaft",
    description: "Werde Teil einer wachsenden Community von Menschen, die Bielefeld aktiv und lebendig gestalten wollen.",
    icon: Users
  },
  {
    title: "Ideen teilen",
    description: "Bring deine eigenen Veranstaltungen ein und teile deine Leidenschaften mit Gleichgesinnten.",
    icon: MessageSquare
  },
  {
    title: "Stadt beleben",
    description: "Gemeinsam machen wir Bielefeld zu einem Ort voller spannender Möglichkeiten und Erlebnisse.",
    icon: Heart
  },
  {
    title: "Immer informiert",
    description: "Verpasse keine Events mehr und bleibe stets auf dem Laufenden, was in deiner Stadt passiert.",
    icon: Clock
  },
  {
    title: "Von Bielefeldernz für Bielefelder",
    description: "Unsere Community lebt vom Engagement lokaler Menschen, die ihre Stadt lieben.",
    icon: MapPin
  }
];

export default About;
