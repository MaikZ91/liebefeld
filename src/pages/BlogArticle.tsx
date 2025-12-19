import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import SEO from '@/components/SEO';
import { ArrowLeft, Calendar, Clock, Eye, Share2, Tag, Sparkles, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface BlogArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  featured_image: string | null;
  published_at: string;
  views: number;
  city: string;
  event_ids: string[];
}

interface RelatedEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  category: string;
}

const categoryLabels: Record<string, string> = {
  'weekly-preview': 'Wochenvorschau',
  'event-recap': 'Rückblick',
  'category-guide': 'Guide',
  'daily-highlights': 'Heute',
};

export default function BlogArticle() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<BlogArticle | null>(null);
  const [relatedEvents, setRelatedEvents] = useState<RelatedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchArticle();
    }
  }, [slug]);

  const fetchArticle = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('blog_articles')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (error || !data) {
      console.error('Error fetching article:', error);
      navigate('/blog');
      return;
    }

    setArticle(data);

    // Increment view count
    await supabase
      .from('blog_articles')
      .update({ views: (data.views || 0) + 1 })
      .eq('id', data.id);

    // Fetch related events
    if (data.event_ids && data.event_ids.length > 0) {
      const { data: events } = await supabase
        .from('community_events')
        .select('id, title, date, time, location, category')
        .in('id', data.event_ids);

      if (events) {
        setRelatedEvents(events);
      }
    }

    setLoading(false);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: article?.title,
          text: article?.excerpt,
          url,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link kopiert!');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} Min. Lesezeit`;
  };

  // Generate Article Schema for SEO
  const articleSchema = article ? {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "description": article.excerpt,
    "image": article.featured_image,
    "datePublished": article.published_at,
    "dateModified": article.published_at,
    "author": {
      "@type": "Organization",
      "name": "Liebefeld"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Liebefeld",
      "logo": {
        "@type": "ImageObject",
        "url": "https://liebefeld.lovable.app/icon-512.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://liebefeld.lovable.app/blog/${article.slug}`
    }
  } : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-12 w-3/4 mb-8" />
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return null;
  }

  return (
    <>
      <SEO
        title={`${article.title} | Liebefeld Blog`}
        description={article.excerpt}
        keywords={article.tags.join(', ')}
        url={`https://liebefeld.lovable.app/blog/${article.slug}`}
        image={article.featured_image || undefined}
      />

      {/* Article Schema */}
      {articleSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
        />
      )}

      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/30">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/blog" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>Zurück zum Blog</span>
            </Link>
            <Button variant="ghost" size="icon" onClick={handleShare}>
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Article Content */}
        <article className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
              {categoryLabels[article.category] || article.category}
            </Badge>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Sparkles className="w-3 h-3" />
              KI-generiert
            </span>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {formatDate(article.published_at)}
            </span>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="w-3 h-3" />
              {formatReadingTime(article.content)}
            </span>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Eye className="w-3 h-3" />
              {article.views} Aufrufe
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
            {article.title}
          </h1>

          {/* Featured Image */}
          {article.featured_image && (
            <div className="relative rounded-xl overflow-hidden mb-8">
              <img 
                src={article.featured_image} 
                alt={article.title}
                className="w-full h-64 md:h-96 object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div 
            className="prose prose-invert prose-lg max-w-none
              prose-headings:font-bold prose-headings:text-foreground
              prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
              prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
              prose-p:text-muted-foreground prose-p:leading-relaxed
              prose-strong:text-foreground prose-strong:font-semibold
              prose-ul:text-muted-foreground prose-li:mb-1
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
            dangerouslySetInnerHTML={{ 
              __html: article.content
                .replace(/\n/g, '<br>')
                .replace(/## (.*?)(?=\n|<br>|$)/g, '<h2>$1</h2>')
                .replace(/### (.*?)(?=\n|<br>|$)/g, '<h3>$1</h3>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/- (.*?)(?=\n|<br>|$)/g, '<li>$1</li>')
            }}
          />

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-8 pt-8 border-t border-border/30">
              <Tag className="w-4 h-4 text-muted-foreground" />
              {article.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="bg-muted/50">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Related Events */}
          {relatedEvents.length > 0 && (
            <div className="mt-12 pt-8 border-t border-border/30">
              <h2 className="text-2xl font-bold mb-6">Erwähnte Events</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {relatedEvents.map(event => (
                  <Link 
                    key={event.id} 
                    to={`/?event=${event.id}`}
                    className="group flex items-center gap-4 p-4 rounded-lg bg-card/50 border border-border/30 hover:border-primary/50 transition-all"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold group-hover:text-primary transition-colors">
                        {event.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.date).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })} • {event.time} • {event.location}
                      </p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="mt-12 p-8 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 text-center">
            <h3 className="text-xl font-bold mb-2">Entdecke mehr Events</h3>
            <p className="text-muted-foreground mb-4">
              Finde alle Events in Bielefeld und werde Teil der Community!
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/">
                <Button>Zur Event-Karte</Button>
              </Link>
              <Link to="/tribe">
                <Button variant="outline">Tribe App</Button>
              </Link>
            </div>
          </div>
        </article>
      </div>
    </>
  );
}
