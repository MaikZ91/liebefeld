-- Create blog_articles table for AI-generated content
CREATE TABLE public.blog_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'weekly-preview',
  featured_image TEXT,
  tags TEXT[] DEFAULT '{}',
  city TEXT DEFAULT 'Bielefeld',
  event_ids UUID[] DEFAULT '{}',
  published_at TIMESTAMP WITH TIME ZONE,
  is_published BOOLEAN DEFAULT false,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.blog_articles ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (published articles only)
CREATE POLICY "Published articles are viewable by everyone" 
ON public.blog_articles 
FOR SELECT 
USING (is_published = true);

-- Create policy for insert (edge functions with service role)
CREATE POLICY "Service role can insert articles" 
ON public.blog_articles 
FOR INSERT 
WITH CHECK (true);

-- Create policy for update (edge functions with service role)
CREATE POLICY "Service role can update articles" 
ON public.blog_articles 
FOR UPDATE 
USING (true);

-- Create index for faster slug lookups
CREATE INDEX idx_blog_articles_slug ON public.blog_articles(slug);

-- Create index for category filtering
CREATE INDEX idx_blog_articles_category ON public.blog_articles(category);

-- Create index for published articles sorted by date
CREATE INDEX idx_blog_articles_published ON public.blog_articles(is_published, published_at DESC);

-- Create trigger for automatic timestamp updates using existing function
CREATE TRIGGER update_blog_articles_updated_at
BEFORE UPDATE ON public.blog_articles
FOR EACH ROW
EXECUTE FUNCTION public.update_user_levels_updated_at_column();