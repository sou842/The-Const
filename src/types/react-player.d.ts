import { Component, ReactNode } from 'react';

export interface SourceProps {
  src: string;
  type: string;
}

export interface ReactPlayerProps {
  url?: string | string[] | SourceProps[] | MediaStream;
  playing?: boolean;
  loop?: boolean;
  controls?: boolean;
  volume?: number;
  muted?: boolean;
  playbackRate?: number;
  width?: string | number;
  height?: string | number;
  style?: any;
  progressInterval?: number;
  playsinline?: boolean;
  pip?: boolean;
  stopOnUnmount?: boolean;
  light?: boolean | string;
  playIcon?: ReactNode;
  previewTabIndex?: number;
  oEmbedConfig?: any;
  config?: any;
  onReady?: (player: any) => void;
  onStart?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onBuffer?: () => void;
  onBufferEnd?: () => void;
  onEnded?: () => void;
  onError?: (error: any, data?: any, hlsInstance?: any, hlsGlobal?: any) => void;
  onDuration?: (duration: number) => void;
  onSeek?: (seconds: number) => void;
  onProgress?: (state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => void;
  onEnablePIP?: () => void;
  onDisablePIP?: () => void;
  [key: string]: any;
}

declare module 'react-player' {
  export default class ReactPlayer extends Component<ReactPlayerProps> {}
}

declare module 'react-player/youtube' {
  import ReactPlayer from 'react-player';
  export default ReactPlayer;
}
