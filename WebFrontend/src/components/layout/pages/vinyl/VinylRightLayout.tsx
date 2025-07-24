// components/molecules/VideoActionPanel.tsx

import React from 'react';
import IconWithCount from './ItemWithCount';
import IconWithNoCount from './ItemWithNoCount';
import type { Video } from '@/types/video';

interface VideoActionPanelProps {
  video: Video;
  divHeight: number;
  onClickLike?: () => void;
  onClickComments?: () => void;
  onClickShare?: () => void;
}

const VinylRightLayout: React.FC<VideoActionPanelProps> = ({ video, divHeight, onClickLike, onClickComments, onClickShare }) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: `${divHeight * 0.42}px`,
        right: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        zIndex: 10,
      }}
    >

      <IconWithCount iconName="vinyl" iconSecondName='fullVinyl' iconSecondColor='white' count={video.likeCount} onClick={onClickLike} video={video}/>
      <IconWithCount iconName="chat" count={video.commentCount} onClick={onClickComments}/>
      <IconWithNoCount iconName="share" onClick={onClickShare}/>
    </div>
  );
};

export default VinylRightLayout;