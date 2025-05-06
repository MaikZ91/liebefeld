
import React from 'react';

interface UserLoadingStateProps {
  error: string | null;
  loading: boolean;
  userCount: number;
}

const UserLoadingState: React.FC<UserLoadingStateProps> = ({
  error,
  loading,
  userCount
}) => {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin h-6 w-6 border-2 border-red-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-red-500 py-4 text-center">
        Fehler beim Laden der Benutzer: {error}
      </div>
    );
  }
  
  if (userCount === 0) {
    return (
      <div className="text-gray-400 py-4 text-center">
        Keine Benutzer online
      </div>
    );
  }
  
  return null;
};

export default UserLoadingState;
