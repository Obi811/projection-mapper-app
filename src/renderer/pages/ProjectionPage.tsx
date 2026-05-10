/**
 * Projection Page — Main workspace.
 *
 * Houses the WebGL canvas (Three.js via @react-three/fiber),
 * the sidebar controls, and the toolbar.
 * This is the primary view after authentication.
 */

import React, { useState } from 'react';
import { ProjectionCanvas } from '../components/ProjectionCanvas';
import { Sidebar } from '../components/Sidebar';
import { Toolbar } from '../components/Toolbar';

export const ProjectionPage: React.FC = () => {
  const [overlayText, setOverlayText] = useState('Hello Projection!');
  const [fontSize, setFontSize] = useState(72);
  const [textColor, setTextColor] = useState('#ffffff');

  return (
    <div style={styles.layout}>
      {/* Top toolbar */}
      <Toolbar />

      <div style={styles.workspace}>
        {/* Left sidebar — controls & settings */}
        <Sidebar
          overlayText={overlayText}
          onTextChange={setOverlayText}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          textColor={textColor}
          onTextColorChange={setTextColor}
        />

        {/* Main canvas area */}
        <div style={styles.canvasContainer}>
          <ProjectionCanvas
            text={overlayText}
            fontSize={fontSize}
            textColor={textColor}
          />
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  layout: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  workspace: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  canvasContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
};
