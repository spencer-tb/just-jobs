declare module 'react-infinite-scroll-component' {
  import * as React from 'react';

  interface InfiniteScrollProps {
    children: React.ReactNode;
    dataLength: number;
    next: () => void;
    hasMore: boolean;
    loader: React.ReactNode;
    endMessage?: React.ReactNode;
    scrollThreshold?: number | string;
    hasChildren?: boolean;
    height?: number | string;
    scrollableTarget?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    pullDownToRefresh?: boolean;
    pullDownToRefreshThreshold?: number;
    pullDownToRefreshContent?: React.ReactNode;
    releaseToRefreshContent?: React.ReactNode;
    refreshFunction?: () => void;
  }

  export default class InfiniteScroll extends React.Component<InfiniteScrollProps, any> {}
}
