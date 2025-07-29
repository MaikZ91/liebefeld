import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  getTodaysChallenge, 
  completeChallenge, 
  getUserLevel, 
  UserChallenge, 
  UserLevel 
} from '@/services/challengeService';
import { USERNAME_KEY } from '@/types/chatTypes';
import { Trophy, Target, Flame, CheckCircle } from 'lucide-react';

const ChallengePage: React.FC = () => {
  const [challenge, setChallenge] = useState<UserChallenge | null>(null);
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const { toast } = useToast();

  const username = localStorage.getItem(USERNAME_KEY) || 'Anonymous';

  useEffect(() => {
    loadChallengeData();
  }, []);

  const loadChallengeData = async () => {
    setIsLoading(true);
    try {
      const [challengeData, levelData] = await Promise.all([
        getTodaysChallenge(username),
        getUserLevel(username)
      ]);
      
      setChallenge(challengeData);
      setUserLevel(levelData);
    } catch (error) {
      console.error('Error loading challenge data:', error);
      toast({
        title: "Fehler",
        description: "Challenge-Daten konnten nicht geladen werden.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteChallenge = async () => {
    if (!challenge || challenge.completed) return;
    
    setIsCompleting(true);
    try {
      const success = await completeChallenge(challenge.id, username);
      
      if (success) {
        setChallenge(prev => prev ? { ...prev, completed: true } : null);
        await loadChallengeData(); // Reload to get updated level
        
        toast({
          title: "Glückwunsch! 🎉",
          description: "Du wächst über dich hinaus! Challenge erfolgreich abgeschlossen.",
          variant: "default"
        });
      } else {
        toast({
          title: "Fehler",
          description: "Challenge konnte nicht abgeschlossen werden.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error completing challenge:', error);
      toast({
        title: "Fehler",
        description: "Ein Fehler ist aufgetreten.",
        variant: "destructive"
      });
    } finally {
      setIsCompleting(false);
    }
  };

  const getProgressPercentage = () => {
    if (!userLevel) return 0;
    const challengesNeededForLevel = Math.min(7, 3 + userLevel.current_ep);
    return (userLevel.challenges_completed_this_level / challengesNeededForLevel) * 100;
  };

  const getChallengesNeededForNextLevel = () => {
    if (!userLevel) return 7;
    return Math.min(7, 3 + userLevel.current_ep);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
        <div className="max-w-md mx-auto pt-8 space-y-6">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-2 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="max-w-md mx-auto p-4 pt-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">MIA Coach</h1>
          <p className="text-sm text-muted-foreground">
            Woche {challenge?.week_number || 1}: {challenge?.week_theme || "Persönliches Wachstum"}
          </p>
          <p className="text-xs text-muted-foreground">Heute bist du wieder 1% mutiger ✨</p>
        </div>

        {/* Level Card */}
        <Card className="border-primary/20 bg-card/60 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">EP {userLevel?.current_ep || 1}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {userLevel?.total_challenges_completed || 0}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-muted-foreground">
                    {userLevel?.streak || 0}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {userLevel?.challenges_completed_this_level || 0}/{getChallengesNeededForNextLevel()} Challenges
                </span>
                <span className="text-muted-foreground">
                  {Math.round(getProgressPercentage())}%
                </span>
              </div>
              <Progress value={getProgressPercentage()} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Challenge Card */}
        <Card className="border-primary/20 bg-card/60 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <img 
                src="/lovable-uploads/e819d6a5-7715-4cb0-8f30-952438637b87.png" 
                alt="MIA Avatar" 
                className="w-12 h-12 rounded-full object-cover"
              />
            </div>
            <CardTitle className="text-lg text-foreground">
              {challenge?.completed ? "Challenge geschafft!" : "Deine heutige Challenge"}
            </CardTitle>
            <CardDescription>
              {challenge?.completed 
                ? "Du warst heute mutig! 💪" 
                : "Zeit für persönliches Wachstum"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/30 border border-muted">
              <p className="text-center font-medium text-foreground leading-relaxed mb-3">
                {challenge?.challenge_text || "Lade Challenge..."}
              </p>
              {challenge?.mia_tip && (
                <div className="flex items-start gap-2 p-2 rounded bg-primary/5 border border-primary/20">
                  <span className="text-primary font-semibold text-sm">💡</span>
                  <p className="text-sm text-muted-foreground italic">
                    {challenge.mia_tip}
                  </p>
                </div>
              )}
            </div>
            
            {challenge?.completed ? (
              <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="text-green-700 dark:text-green-300 font-medium">
                  Erledigt!
                </span>
              </div>
            ) : (
              <Button 
                onClick={handleCompleteChallenge}
                disabled={isCompleting || !challenge}
                className="w-full h-12 text-base font-medium"
                size="lg"
              >
                {isCompleting ? "Speichere..." : "Challenge abschließen"}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Motivation */}
        <div className="text-center space-y-2">
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {challenge?.completed 
              ? "Du wächst über dich hinaus! 🌟" 
              : "Mut beginnt mit dem ersten Schritt 🚀"}
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default ChallengePage;