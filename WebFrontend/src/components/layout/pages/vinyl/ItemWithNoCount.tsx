// components/atoms/IconWithCount.tsx

import React from 'react';
import IconButton from '@/components/atoms/button/IconButton';
import type Icon from '@/components/atoms/icon/Icon';

interface IconWithNoCountProps {
  iconName: React.ComponentProps<typeof Icon>['name'];
  count: number;
  iconSize?: number;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const IconWithNoCount: React.FC<IconWithNoCountProps> = ({
  iconName,
  iconSize = 30,
  style,
  onClick,
}) => {
  const baseStyle: React.CSSProperties = {
    color: 'rgba(255, 255, 255, 0.8)',
    width: '35px',
    height: '35px',
    cursor: 'pointer',
    filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.5))',
    margin: '0px',
    padding: '0px',
    ...style,
  };

  const countStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    margin: '0px',
    padding: '0px',
    color: 'rgba(255, 255, 255, 0.8)',
    filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.5))',
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <IconButton iconName={iconName} iconSize={iconSize} style={baseStyle} onClick={onClick}/>
      <span style={countStyle}> </span>
    </div>
  );
};

export default IconWithNoCount;