import { useEffect, useRef, useState } from 'react';

interface PinchZoomOptions {
  minZoom?: number;
  maxZoom?: number;
  zoomSpeed?: number;
}

interface PinchZoomState {
  scale: number;
  posX: number;
  posY: number;
}

export function usePinchZoom(
  elementRef: React.RefObject<HTMLElement>,
  options: PinchZoomOptions = {}
) {
  const {
    minZoom = 1,
    maxZoom = 4,
    zoomSpeed = 0.01
  } = options;

  const [zoomState, setZoomState] = useState<PinchZoomState>({
    scale: 1,
    posX: 0,
    posY: 0
  });

  const lastTouchDistance = useRef<number>(0);
  const lastScale = useRef<number>(1);
  const isPinching = useRef<boolean>(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const getTouchDistance = (touches: TouchList) => {
      const touch1 = touches[0];
      const touch2 = touches[1];
      const dx = touch2.clientX - touch1.clientX;
      const dy = touch2.clientY - touch1.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const getTouchCenter = (touches: TouchList) => {
      const touch1 = touches[0];
      const touch2 = touches[1];
      return {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2
      };
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        isPinching.current = true;
        lastTouchDistance.current = getTouchDistance(e.touches);
        lastScale.current = zoomState.scale;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && isPinching.current) {
        e.preventDefault();
        const currentDistance = getTouchDistance(e.touches);
        const scaleDelta = (currentDistance - lastTouchDistance.current) * zoomSpeed;
        const newScale = Math.min(maxZoom, Math.max(minZoom, lastScale.current + scaleDelta));

        setZoomState(prev => ({
          ...prev,
          scale: newScale
        }));
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        isPinching.current = false;
        lastScale.current = zoomState.scale;
      }
    };

    // Mouse wheel zoom (desktop)
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = -e.deltaY * 0.01;
        const newScale = Math.min(maxZoom, Math.max(minZoom, zoomState.scale + delta));
        
        setZoomState(prev => ({
          ...prev,
          scale: newScale
        }));
      }
    };

    // Double tap to reset zoom (mobile)
    let lastTap = 0;
    const handleDoubleTap = (e: TouchEvent) => {
      const currentTime = Date.now();
      const tapLength = currentTime - lastTap;
      
      if (tapLength < 300 && tapLength > 0 && e.touches.length === 1) {
        e.preventDefault();
        setZoomState({
          scale: zoomState.scale === 1 ? 2 : 1,
          posX: 0,
          posY: 0
        });
      }
      
      lastTap = currentTime;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);
    element.addEventListener('touchstart', handleDoubleTap, { passive: false });
    element.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchstart', handleDoubleTap);
      element.removeEventListener('wheel', handleWheel);
    };
  }, [elementRef, minZoom, maxZoom, zoomSpeed, zoomState.scale]);

  const resetZoom = () => {
    setZoomState({
      scale: 1,
      posX: 0,
      posY: 0
    });
  };

  const setZoom = (scale: number) => {
    setZoomState(prev => ({
      ...prev,
      scale: Math.min(maxZoom, Math.max(minZoom, scale))
    }));
  };

  return {
    scale: zoomState.scale,
    posX: zoomState.posX,
    posY: zoomState.posY,
    resetZoom,
    setZoom,
    isZoomed: zoomState.scale > 1
  };
}
