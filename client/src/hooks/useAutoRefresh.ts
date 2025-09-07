import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface FileChangeMessage {
  type: 'file_changed' | 'force_refresh' | 'connected';
  collection?: string;
  timestamp: string;
  message?: string;
  watchedFiles?: string[];
}

export function useAutoRefresh() {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fallbackIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Detect shared hosting environment
  const isSharedHosting = process.env.NODE_ENV === 'production' && 
                         !window.location.host.includes('replit') &&
                         !window.location.host.includes('localhost');

  const connect = () => {
    // Skip WebSocket for shared hosting, use polling fallback
    if (isSharedHosting) {
      console.log('🚫 WebSocket disabled for shared hosting - using polling fallback');
      startPollingFallback();
      return;
    }
    
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log('🔌 Connecting to file watcher WebSocket:', wsUrl);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ File watcher connected - auto-refresh enabled');
      };

      ws.onmessage = (event) => {
        try {
          const message: FileChangeMessage = JSON.parse(event.data);
          
          switch (message.type) {
            case 'connected':
              console.log('📡 File watcher ready:', message.message);
              console.log('👀 Watching files:', message.watchedFiles?.join(', '));
              break;
              
            case 'file_changed':
            case 'force_refresh':
              console.log(`🔄 Auto-refreshing ${message.collection} data...`);
              
              // Invalidate queries based on collection
              if (message.collection) {
                invalidateQueriesForCollection(message.collection);
              } else {
                // Force refresh all queries
                queryClient.invalidateQueries();
              }
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('🔌 File watcher disconnected - attempting reconnect in 30s...');
        wsRef.current = null;
        
        // Reconnect after 30 seconds (reduced frequency)
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 30000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to connect to file watcher:', error);
      
      // Try to reconnect after 30 seconds (reduced frequency)
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 30000);
    }
  };

  const invalidateQueriesForCollection = (collection: string) => {
    // Map collection names to query keys
    const queryMappings: Record<string, string[]> = {
      'testimonials': ['/api/testimonials', '/api/admin/testimonials'],
      'jobs': ['/api/jobs', '/api/jobs/featured', '/api/admin/jobs'],
      'companies': ['/api/companies', '/api/admin/companies'],
      'job_applications': ['/api/jobs/applications'],
      'users': ['/api/user', '/api/admin/users'],
      'form_submissions': ['/api/admin/submissions'],
      'advertisements': ['/api/advertisements']
    };

    const queryKeys = queryMappings[collection];
    if (queryKeys) {
      queryKeys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
      console.log(`♻️ Refreshed queries for: ${queryKeys.join(', ')}`);
    } else {
      // Fallback - refresh all queries
      queryClient.invalidateQueries();
      console.log('♻️ Refreshed all queries (unknown collection)');
    }
  };

  // Polling fallback for shared hosting
  const startPollingFallback = () => {
    // Poll for updates every 5 minutes (very conservative for shared hosting)
    fallbackIntervalRef.current = setInterval(() => {
      console.log('🔄 Polling for updates (shared hosting mode)');
      queryClient.invalidateQueries();
    }, 5 * 60 * 1000); // 5 minutes
  };

  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current);
      }
      
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    reconnect: connect
  };
}