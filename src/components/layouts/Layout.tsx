// src/components/layouts/Layout.tsx
interface MainNavProps {
  pathname: string;
  activeView?: 'ai' | 'community';
  setActiveView?: (view: 'ai' | 'community') => void;
  handleOpenUserDirectory?: () => void;
  setIsEventListSheetOpen?: (open: boolean) => void;
}

const MainNav: React.FC<MainNavProps> = ({
  pathname,
  activeView,
  setActiveView,
  handleOpenUserDirectory,
  setIsEventListSheetOpen
}) => {

  // If we're on chat page, show THE TRIBE + chat navigation buttons
  if (pathname === '/chat') {
    return (
      <div className="flex items-center w-full">
        <Link to="/" className="mr-6 flex items-center space-x-2">
          <span className="font-bold inline-block">THE TRIBE</span>
        </Link>

        {/* Chat navigation buttons */}
        <div className="flex items-center justify-between w-full">
          <div className="flex space-x-2">
            <Button
              variant={activeView === 'ai' ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveView?.('ai')}
              className={`flex items-center gap-2 ${activeView === 'ai' ? 'bg-red-500 hover:bg-red-600' : ''}`}
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Event Assistent</span>
            </Button>
            <Button
              variant={activeView === 'community' ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveView?.('community')}
              className={`flex items-center gap-2 ${activeView === 'community' ? 'bg-red-500 hover:bg-red-600' : ''}`}
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Community</span>
            </Button>
          </div>

          <div className="flex gap-2">
            {/* User Directory Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenUserDirectory}
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              <span className="hidden md:inline">Benutzer</span>
            </Button>

            {/* Calendar Events Button */}
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsEventListSheetOpen?.(true)}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white"
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden md:inline">Events anzeigen</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // For other pages, show regular navigation
  return (
    <div className="mr-4 flex">
      <Link to="/" className="mr-6 flex items-center space-x-2">
        <span className="font-bold inline-block">THE TRIBE</span>
      </Link>
      {/* Remove or comment out this nav element to remove the links */}
      {/*
      <nav className="flex items-center space-x-6 text-sm font-medium">
        {items.map((item, index) => (
          <Link
            key={index}
            to={item.href}
            className={cn(
              "transition-colors hover:text-foreground/80",
              pathname === item.href ? "text-foreground" : "text-foreground/60"
            )}
          >
            {item.title}
          </Link>
        ))}
      </nav>
      */}
    </div>
  );
};