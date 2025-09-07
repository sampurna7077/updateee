interface LoadingVideoProps {
  className?: string;
  width?: number;
  height?: number;
  fullScreen?: boolean;
}

export default function LoadingVideo({ 
  className = "", 
  width = 120, 
  height = 120, 
  fullScreen = false 
}: LoadingVideoProps) {
  const containerClass = fullScreen 
    ? "fixed inset-0 bg-white z-50 overflow-hidden"
    : `relative bg-white overflow-hidden ${className}`;

  const containerStyle = fullScreen ? { 
    position: 'fixed' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    zIndex: 9999,
    overflow: 'hidden'
  } : {
    position: 'relative' as const,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    minHeight: '200px'
  };

  const videoStyle = {
    position: 'absolute' as const,
    width: `${width}px`,
    height: `${height}px`,
    objectFit: 'contain' as const,
    animation: fullScreen 
      ? 'flyBirdFullScreen 3s ease-in-out infinite'
      : 'flyBirdSmall 3s ease-in-out infinite'
  };

  const spinnerStyle = {
    position: 'absolute' as const,
    width: `${width}px`,
    height: `${height}px`,
    border: '4px solid #e2e8f0',
    borderTop: '4px solid #3b82f6',
    borderRadius: '50%',
    animation: fullScreen 
      ? 'flySpinnerFullScreen 3s ease-in-out infinite'
      : 'flySpinnerSmall 3s ease-in-out infinite'
  };

  return (
    <>
      <style>
        {`
          @keyframes flyBirdFullScreen {
            0% {
              bottom: 10%;
              left: 10%;
              transform: rotate(-15deg) scale(1);
            }
            50% {
              bottom: 60%;
              left: 45%;
              transform: rotate(5deg) scale(1.1);
            }
            100% {
              bottom: 80%;
              left: 80%;
              transform: rotate(15deg) scale(1);
            }
          }
          
          @keyframes flyBirdSmall {
            0% {
              bottom: 5%;
              left: 5%;
              transform: rotate(-15deg) scale(1);
            }
            50% {
              bottom: 50%;
              left: 40%;
              transform: rotate(5deg) scale(1.1);
            }
            100% {
              bottom: 75%;
              left: 75%;
              transform: rotate(15deg) scale(1);
            }
          }
          
          @keyframes flySpinnerFullScreen {
            0% {
              bottom: 10%;
              left: 10%;
              transform: rotate(0deg);
            }
            50% {
              bottom: 60%;
              left: 45%;
              transform: rotate(180deg);
            }
            100% {
              bottom: 80%;
              left: 80%;
              transform: rotate(360deg);
            }
          }
          
          @keyframes flySpinnerSmall {
            0% {
              bottom: 5%;
              left: 5%;
              transform: rotate(0deg);
            }
            50% {
              bottom: 50%;
              left: 40%;
              transform: rotate(180deg);
            }
            100% {
              bottom: 75%;
              left: 75%;
              transform: rotate(360deg);
            }
          }
        `}
      </style>
      <div style={containerStyle}>
        <video
          style={videoStyle}
          width={width}
          height={height}
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/loading.mp4" type="video/mp4" />
          {/* Fallback for browsers that don't support video */}
          <div style={spinnerStyle}></div>
        </video>
      </div>
    </>
  );
}