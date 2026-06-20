/**
 * ProjectorPreview — Thumbnail preview canvas for a single projector.
 *
 * Renders a scaled-down Three.js scene showing what each projector
 * is outputting. Used in the Projector Management UI.
 */

import React, { useRef, useEffect } from 'react';

interface ProjectorPreviewProps {
  projectorId: string;
  projectorName: string;
  width?: number;
  height?: number;
  /** Surfaces assigned to this projector */
  assignedSurfaces: string[];
  /** Whether the projector is currently active */
  isActive: boolean;
}

export const ProjectorPreview: React.FC<ProjectorPreviewProps> = ({
  projectorId,
  projectorName,
  width = 192,
  height = 108,
  assignedSurfaces,
  isActive,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw preview background
    ctx.fillStyle = isActive ? '#1a1a2e' : '#0d0d0d';
    ctx.fillRect(0, 0, width, height);

    // Draw grid pattern
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 0.5;
    const gridSize = 20;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw surface indicators
    if (assignedSurfaces.length > 0) {
      const surfaceWidth = (width - 20) / Math.min(assignedSurfaces.length, 4);
      assignedSurfaces.forEach((surfaceId, index) => {
        const x = 10 + (index % 4) * surfaceWidth;
        const y = 10 + Math.floor(index / 4) * 40;

        ctx.fillStyle = isActive ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.15)';
        ctx.strokeStyle = isActive ? '#6366f1' : '#4f46e5';
        ctx.lineWidth = 1;
        ctx.fillRect(x, y, surfaceWidth - 4, 30);
        ctx.strokeRect(x, y, surfaceWidth - 4, 30);

        // Surface label
        ctx.fillStyle = '#a1a1aa';
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
          `S${index + 1}`,
          x + (surfaceWidth - 4) / 2,
          y + 18,
        );
      });
    } else {
      // No surfaces assigned
      ctx.fillStyle = '#71717a';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Keine Flächen', width / 2, height / 2);
    }

    // Draw active indicator
    if (isActive) {
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, width - 2, height - 2);
    }
  }, [projectorId, width, height, assignedSurfaces, isActive, projectorName]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        borderRadius: 6,
        border: `1px solid ${isActive ? '#22c55e' : '#27272a'}`,
        display: 'block',
      }}
      title={`Preview: ${projectorName}`}
    />
  );
};
