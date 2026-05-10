/**
 * CornerHandles — Interactive draggable corner points for keystone correction.
 *
 * Renders 4 draggable handles on top of the canvas that correspond
 * to the keystone corners. Supports:
 * - Mouse drag to move corners
 * - Keyboard arrow keys for precise adjustment
 * - Snap-to-grid (optional)
 * - Visual feedback during drag operations
 *
 * This is a 2D HTML overlay (not part of the Three.js scene) to ensure
 * consistent interaction behaviour independent of camera state.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { KeystoneCorners, Point2D } from '../../shared/types';
import {
  KEYSTONE_SNAP_GRID_SIZE,
  KEYSTONE_ARROW_STEP,
  KEYSTONE_ARROW_STEP_FINE,
} from '../../shared/constants';
import { clampCorner, snapToGrid } from '../../services/keystone-engine';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CornerHandlesProps {
  corners: KeystoneCorners;
  onChange: (corners: KeystoneCorners) => void;
  /** Whether keystone editing is active */
  active: boolean;
  /** Enable snap-to-grid */
  snapEnabled?: boolean;
  /** Container dimensions (for mapping normalised coords to pixels) */
  containerWidth: number;
  containerHeight: number;
}

type CornerIndex = 0 | 1 | 2 | 3;

const CORNER_LABELS = ['TL', 'TR', 'BR', 'BL'] as const;
const HANDLE_SIZE = 16;
const HANDLE_HIT_SIZE = 32;

// ─── Component ───────────────────────────────────────────────────────────────

export const CornerHandles: React.FC<CornerHandlesProps> = ({
  corners,
  onChange,
  active,
  snapEnabled = false,
  containerWidth,
  containerHeight,
}) => {
  const [dragIndex, setDragIndex] = useState<CornerIndex | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<CornerIndex | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<CornerIndex | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ─── Coordinate Mapping ──────────────────────────────────────────────

  /** Convert normalised [0..1] to pixel position in container */
  const toPixel = useCallback(
    (point: Point2D): { x: number; y: number } => ({
      x: point.x * containerWidth,
      y: (1 - point.y) * containerHeight, // Flip Y: normalised Y=1 is top
    }),
    [containerWidth, containerHeight],
  );

  /** Convert pixel position to normalised [0..1] */
  const toNormalised = useCallback(
    (px: number, py: number): Point2D => ({
      x: px / containerWidth,
      y: 1 - py / containerHeight,
    }),
    [containerWidth, containerHeight],
  );

  // ─── Drag Handling ───────────────────────────────────────────────────

  const handleMouseDown = useCallback(
    (index: CornerIndex, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragIndex(index);
      setSelectedIndex(index);
    },
    [],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (dragIndex === null || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;

      let point = toNormalised(px, py);
      point = clampCorner(point);

      if (snapEnabled) {
        point = snapToGrid(point, KEYSTONE_SNAP_GRID_SIZE);
      }

      const newCorners = [...corners] as KeystoneCorners;
      newCorners[dragIndex] = point;
      onChange(newCorners);
    },
    [dragIndex, corners, onChange, toNormalised, snapEnabled],
  );

  const handleMouseUp = useCallback(() => {
    setDragIndex(null);
  }, []);

  // Register global mouse events for drag
  useEffect(() => {
    if (dragIndex !== null) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragIndex, handleMouseMove, handleMouseUp]);

  // ─── Keyboard Handling ───────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!active || selectedIndex === null) return;

      const step = e.shiftKey ? KEYSTONE_ARROW_STEP_FINE : KEYSTONE_ARROW_STEP;
      let dx = 0;
      let dy = 0;

      switch (e.key) {
        case 'ArrowLeft':
          dx = -step;
          break;
        case 'ArrowRight':
          dx = step;
          break;
        case 'ArrowUp':
          dy = step; // Normalised Y up = positive
          break;
        case 'ArrowDown':
          dy = -step;
          break;
        case 'Escape':
          setSelectedIndex(null);
          return;
        case 'Tab':
          e.preventDefault();
          // Cycle through corners
          setSelectedIndex(((selectedIndex + (e.shiftKey ? 3 : 1)) % 4) as CornerIndex);
          return;
        default:
          return;
      }

      e.preventDefault();

      const newCorners = [...corners] as KeystoneCorners;
      const current = newCorners[selectedIndex];
      let newPoint: Point2D = { x: current.x + dx, y: current.y + dy };
      newPoint = clampCorner(newPoint);

      if (snapEnabled) {
        newPoint = snapToGrid(newPoint, KEYSTONE_SNAP_GRID_SIZE);
      }

      newCorners[selectedIndex] = newPoint;
      onChange(newCorners);
    },
    [active, selectedIndex, corners, onChange, snapEnabled],
  );

  useEffect(() => {
    if (active) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [active, handleKeyDown]);

  // ─── Render ──────────────────────────────────────────────────────────

  if (!active) return null;

  return (
    <div
      ref={containerRef}
      style={styles.container}
      data-testid="corner-handles-container"
    >
      {/* Guide lines connecting corners */}
      <svg
        style={styles.svg}
        width={containerWidth}
        height={containerHeight}
        viewBox={`0 0 ${containerWidth} ${containerHeight}`}
      >
        {/* Quadrilateral outline */}
        <polygon
          points={corners
            .map((c) => {
              const px = toPixel(c);
              return `${px.x},${px.y}`;
            })
            .join(' ')}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={1.5}
          strokeDasharray="6,3"
          opacity={0.7}
        />

        {/* Diagonals */}
        {(() => {
          const tl = toPixel(corners[0]);
          const br = toPixel(corners[2]);
          const tr = toPixel(corners[1]);
          const bl = toPixel(corners[3]);
          return (
            <>
              <line
                x1={tl.x} y1={tl.y} x2={br.x} y2={br.y}
                stroke="#f59e0b" strokeWidth={0.5} opacity={0.3}
              />
              <line
                x1={tr.x} y1={tr.y} x2={bl.x} y2={bl.y}
                stroke="#f59e0b" strokeWidth={0.5} opacity={0.3}
              />
            </>
          );
        })()}
      </svg>

      {/* Corner handles */}
      {corners.map((corner, index) => {
        const px = toPixel(corner);
        const isDragging = dragIndex === index;
        const isSelected = selectedIndex === index;
        const isHovered = hoveredIndex === index;

        return (
          <div
            key={index}
            data-testid={`corner-handle-${index}`}
            style={{
              ...styles.handleHitArea,
              left: px.x - HANDLE_HIT_SIZE / 2,
              top: px.y - HANDLE_HIT_SIZE / 2,
              width: HANDLE_HIT_SIZE,
              height: HANDLE_HIT_SIZE,
              cursor: isDragging ? 'grabbing' : 'grab',
            }}
            onMouseDown={(e) => handleMouseDown(index as CornerIndex, e)}
            onMouseEnter={() => setHoveredIndex(index as CornerIndex)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {/* Visual handle */}
            <div
              style={{
                ...styles.handle,
                width: HANDLE_SIZE,
                height: HANDLE_SIZE,
                backgroundColor: isDragging
                  ? '#f59e0b'
                  : isSelected
                  ? '#6366f1'
                  : isHovered
                  ? '#818cf8'
                  : '#4f46e5',
                transform: isDragging
                  ? 'scale(1.3)'
                  : isHovered
                  ? 'scale(1.15)'
                  : 'scale(1)',
                boxShadow: isSelected
                  ? '0 0 0 3px rgba(99, 102, 241, 0.4)'
                  : isDragging
                  ? '0 0 0 3px rgba(245, 158, 11, 0.4)'
                  : 'none',
              }}
            />

            {/* Corner label */}
            <span
              style={{
                ...styles.label,
                opacity: isDragging || isSelected || isHovered ? 1 : 0.6,
              }}
            >
              {CORNER_LABELS[index]}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    zIndex: 10,
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
    pointerEvents: 'none',
  },
  handleHitArea: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'auto',
    zIndex: 11,
  },
  handle: {
    borderRadius: '50%',
    border: '2px solid white',
    transition: 'transform 0.1s, background-color 0.1s, box-shadow 0.15s',
  },
  label: {
    fontSize: 9,
    fontWeight: 700,
    color: '#e4e4e7',
    marginTop: 2,
    textShadow: '0 1px 2px rgba(0,0,0,0.8)',
    transition: 'opacity 0.15s',
    userSelect: 'none',
    pointerEvents: 'none',
  },
};
