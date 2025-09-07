import { useState, useEffect } from 'react';

export function useFirstVisit(pageKey: string, delayMs: number = 2500) {
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [isDelayComplete, setIsDelayComplete] = useState(false);

  useEffect(() => {
    const visitedKey = `visited_${pageKey}`;
    const hasVisited = sessionStorage.getItem(visitedKey);
    
    if (!hasVisited) {
      setIsFirstVisit(true);
      sessionStorage.setItem(visitedKey, 'true');
      
      // Add artificial delay for first visit
      const timer = setTimeout(() => {
        setIsDelayComplete(true);
      }, delayMs);
      
      return () => clearTimeout(timer);
    } else {
      setIsDelayComplete(true);
    }
  }, [pageKey, delayMs]);

  return {
    isFirstVisit,
    shouldShowLoading: isFirstVisit && !isDelayComplete
  };
}