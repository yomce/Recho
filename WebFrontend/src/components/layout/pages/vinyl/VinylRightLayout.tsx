// components/molecules/VideoActionPanel.tsx

import React from 'react';
import IconWithCount from './ItemWithCount';

interface VideoActionPanelProps {
  likes: number;
  comments: number;
  divHeight: number;
}

const VinylRightLayout: React.FC<VideoActionPanelProps> = ({ likes, comments, divHeight }) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: `${divHeight * 0.5}px`,
        right: '24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0px',
        zIndex: 10,
      }}
    >
      <IconWithCount iconName="vinyl" count={likes} />
      <IconWithCount iconName="chat" count={comments} />
    </div>
  );
};

export default VinylRightLayout;