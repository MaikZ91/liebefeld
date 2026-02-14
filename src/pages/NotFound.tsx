
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      
      <main className="flex-grow flex items-center justify-center">
        <div className="text-center max-w-md px-4 py-8 animate-fade-in">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-8">
            <Calendar className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-4xl font-bold mb-4">404</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Diese Seite existiert leider nicht
          </p>
          <Link to="/">
            <Button className="rounded-full">
              Zurück zum Kalender
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default NotFound;
