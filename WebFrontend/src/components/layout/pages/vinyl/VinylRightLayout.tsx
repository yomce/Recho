// components/molecules/VideoActionPanel.tsx

import React from 'react';
import IconWithCount from './ItemWithCount';
import IconWithNoCount from './ItemWithNoCount';

interface VideoActionPanelProps {
  likes: number;
  comments: number;
  divHeight: number;
  onClickLike?: () => void;
  onClickComments?: () => void;
  onClickShare?: () => void;
}

const VinylRightLayout: React.FC<VideoActionPanelProps> = ({ likes, comments, divHeight, onClickLike, onClickComments, onClickShare }) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: `${divHeight * 0.42}px`,
        right: '24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        zIndex: 10,
      }}
    >

      <IconWithCount iconName="vinyl" count={likes} onClick={onClickLike}/>
      <IconWithCount iconName="chat" count={comments} onClick={onClickComments}/>
      <IconWithNoCount iconName="share" count={likes} onClick={onClickShare}/>
    </div>
  );
};

export default VinylRightLayout;