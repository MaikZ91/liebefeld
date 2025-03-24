
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Briefcase, Mail, Send } from 'lucide-react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name muss mindestens 2 Zeichen haben.' }),
  email: z.string().email({ message: 'Bitte gib eine gültige E-Mail-Adresse ein.' }),
  company: z.string().min(1, { message: 'Bitte gib einen Firmennamen ein.' }),
  message: z.string().min(10, { message: 'Nachricht muss mindestens 10 Zeichen haben.' })
});

type FormValues = z.infer<typeof formSchema>;

const PartnershipsInfo = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      company: '',
      message: ''
    }
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      // In a real application, this would send data to a server
      // For now we'll simulate sending an email
      console.log('Sending partnership request:', data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Anfrage gesendet!",
        description: "Wir haben deine Partnerschaftsanfrage erhalten und werden uns in Kürze bei dir melden.",
        variant: "default",
      });
      
      form.reset();
    } catch (error) {
      console.error('Error sending partnership request:', error);
      toast({
        title: "Fehler beim Senden",
        description: "Deine Anfrage konnte nicht gesendet werden. Bitte versuche es später erneut oder kontaktiere uns direkt per E-Mail.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="glass-card border border-orange-200 dark:border-orange-900 shadow-lg">
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="h-5 w-5 text-orange-500" />
              <h3 className="text-xl font-semibold">Partnerschaften & Kooperationen</h3>
            </div>
            
            <p className="mb-3">
              Wir sind auf der Suche nach lokalen Unternehmen und Partnern, die Events in Liebefeld anbieten möchten.
            </p>
            
            <ul className="list-disc list-inside space-y-2 mb-4 text-sm">
              <li>Steigere die Sichtbarkeit deines Unternehmens in der Community</li>
              <li>Erreiche gezielt lokale Kunden und Interessenten</li>
              <li>Veranstalte exklusive Events für unsere Community</li>
              <li>Profitiere von unserer wachsenden Nutzerbasis</li>
            </ul>
            
            <div className="flex items-center gap-2 text-sm mt-5">
              <Mail className="h-4 w-4 text-orange-500" />
              <span>Direktkontakt: maik.z@gmx.de</span>
            </div>
          </div>
          
          <div className="flex-1">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        <Input placeholder="deine@email.de" {...field} />
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
                      <FormLabel>Unternehmen</FormLabel>
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
                          placeholder="Wie können wir zusammenarbeiten?" 
                          {...field} 
                          className="min-h-[100px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  <Send className="mr-2 h-4 w-4" />
                  {isSubmitting ? 'Wird gesendet...' : 'Anfrage senden'}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PartnershipsInfo;
