
import React, { useState } from 'react';
import { Layout } from '@/components/layouts/Layout';
import EventChatBot from '@/components/EventChatBot';
import { CalendarWithChat } from '@/components/calendar-chat';
import UserDirectory from '@/components/users/UserDirectory';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

const Chat = () => {
  // Start with AI chat mode as default
  const [activeView, setActiveView] = useState<'ai' | 'community'>('ai');
  const [isUserDirectoryOpen, setIsUserDirectoryOpen] = useState(false);
  const [isEventListSheetOpen, setIsEventListSheetOpen] = useState(false);

  const handleOpenUserDirectory = () => {
    setIsUserDirectoryOpen(true);
  };

  return (
    <Layout
      hideFooter={true}
      activeView={activeView}
      setActiveView={setActiveView}
      handleOpenUserDirectory={handleOpenUserDirectory}
      setIsEventListSheetOpen={setIsEventListSheetOpen}
    >
      <div className="h-screen w-full bg-black text-white overflow-hidden">
        {activeView === 'ai' ? (
          <EventChatBot 
            fullPage={true}
            activeChatMode={activeView}
            setActiveChatMode={setActiveView}
          />
        ) : (
          <CalendarWithChat />
        )}
        
        <Sheet open={isUserDirectoryOpen} onOpenChange={setIsUserDirectoryOpen}>
          <SheetContent side="right" className="w-full sm:max-w-lg bg-gray-900 text-white border-gray-700">
            <SheetHeader>
              <SheetTitle className="text-white">Benutzer-Verzeichnis</SheetTitle>
            </SheetHeader>
            <UserDirectory />
          </SheetContent>
        </Sheet>
        
        <Sheet open={isEventListSheetOpen} onOpenChange={setIsEventListSheetOpen}>
          <SheetContent side="bottom" className="h-[80vh] bg-gray-900 text-white border-gray-700">
            <SheetHeader>
              <SheetTitle className="text-white">Events</SheetTitle>
            </SheetHeader>
            <CalendarWithChat />
          </SheetContent>
        </Sheet>
      </div>
    </Layout>
  );
};

export default Chat;
