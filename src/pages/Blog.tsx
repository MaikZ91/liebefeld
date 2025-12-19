import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import SEO from '@/components/SEO';
import { Calendar, Clock, Eye, Tag, ArrowRight, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface BlogArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  featured_image: string | null;
  published_at: string;
  views: number;
  city: string;
}

const categoryColors: Record<string, string> = {
  'weekly-preview': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'event-recap': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'category-guide': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'daily-highlights': 'bg-green-500/20 text-green-300 border-green-500/30',
};

const categoryLabels: Record<string, string> = {
  'weekly-preview': 'Wochenvorschau',
  'event-recap': 'Rückblick',
  'category-guide': 'Guide',
  'daily-highlights': 'Heute',
};

export default function Blog() {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchArticles();
  }, [selectedCategory]);

  const fetchArticles = async () => {
    setLoading(true);
    let query = supabase
      .from('blog_articles')
      .select('id, slug, title, excerpt, category, tags, featured_image, published_at, views, city')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(20);

    if (selectedCategory) {
      query = query.eq('category', selectedCategory);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching articles:', error);
    } else {
      setArticles(data || []);
    }
    setLoading(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <>
      <SEO
        title="Blog - Events & Tipps für Bielefeld | Liebefeld"
        description="Wöchentliche Event-Vorschauen, Rückblicke und Insider-Tipps für Bielefeld. Entdecke was in deiner Stadt los ist."
        keywords="Bielefeld Blog, Events Bielefeld, Wochenvorschau, Event-Tipps, Nachtleben Bielefeld"
        url="https://liebefeld.lovable.app/blog"
      />

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="relative overflow-hidden border-b border-border/30 bg-gradient-to-b from-primary/5 to-background">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
          <div className="relative container mx-auto px-4 py-16 md:py-24">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-primary font-medium">KI-generiert</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">
              <span className="bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                Event-Blog
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
              Dein wöchentlicher Guide für Events, Partys und Geheimtipps in Bielefeld. 
              Automatisch kuratiert aus echten Events und Community-Insights.
            </p>
          </div>
        </div>

        {/* Category Filter */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/30">
          <div className="container mx-auto px-4 py-4">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  !selectedCategory 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }`}
              >
                Alle
              </button>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    selectedCategory === key 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Articles Grid */}
        <div className="container mx-auto px-4 py-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="bg-card/50 border-border/30">
                  <CardHeader className="pb-4">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-3/4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full mb-4" />
                    <Skeleton className="h-4 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-16">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Noch keine Artikel</h2>
              <p className="text-muted-foreground">
                Die ersten KI-generierten Artikel erscheinen bald!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article, index) => (
                <Link key={article.id} to={`/blog/${article.slug}`}>
                  <Card className={`group bg-card/50 border-border/30 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 ${
                    index === 0 ? 'md:col-span-2 lg:col-span-2' : ''
                  }`}>
                    {article.featured_image && (
                      <div className="relative h-48 overflow-hidden rounded-t-lg">
                        <img 
                          src={article.featured_image} 
                          alt={article.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                      </div>
                    )}
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge 
                          variant="outline" 
                          className={categoryColors[article.category] || 'bg-muted text-muted-foreground'}
                        >
                          {categoryLabels[article.category] || article.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {article.views}
                        </span>
                      </div>
                      <h2 className={`font-bold leading-tight group-hover:text-primary transition-colors ${
                        index === 0 ? 'text-2xl' : 'text-lg'
                      }`}>
                        {article.title}
                      </h2>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                        {article.excerpt}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(article.published_at)}
                          </span>
                        </div>
                        <span className="flex items-center gap-1 text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          Lesen <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                      {article.tags && article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {article.tags.slice(0, 4).map(tag => (
                            <span key={tag} className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
