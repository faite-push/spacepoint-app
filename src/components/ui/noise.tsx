import React, { useRef, useEffect } from 'react';

interface NoiseProps {
  patternSize?: number;
  patternScaleX?: number;
  patternScaleY?: number;
  patternRefreshInterval?: number;
  patternAlpha?: number;
}

const Noise: React.FC<NoiseProps> = ({
  patternSize = 250,
  patternScaleX = 1,
  patternScaleY = 1,
  patternRefreshInterval = 2,
  patternAlpha = 15
}) => {
  const grainRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = grainRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;



    const canvasSize = 1024;

    const resize = () => {
      if (!canvas) return;
      canvas.width = canvasSize;
      canvas.height = canvasSize;

      canvas.style.width = '100%';
      canvas.style.height = '100%';
    };

    const drawGrain = () => {
      const imageData = ctx.createImageData(canvasSize, canvasSize);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const value = Math.random() * 255;
        data[i] = value;
        data[i + 1] = value;
        data[i + 2] = value;
        data[i + 3] = patternAlpha;
      }

      ctx.putImageData(imageData, 0, 0);
    };

    window.addEventListener('resize', resize);
    resize();
    drawGrain();

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, [patternSize, patternScaleX, patternScaleY, patternAlpha]);

  return (
    <canvas
      className="pointer-events-none absolute inset-0 h-full w-full opacity-50"
      ref={grainRef}
      style={{
        imageRendering: 'pixelated'
      }}
    />
  );
};

export default Noise;