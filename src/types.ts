import type { ReactNode } from 'react';
import type { ImageStyle, StyleProp } from 'react-native';

export type StoryMediaType = 'image' | 'video';

export type Story = {
  /**
   * The url of the resource, be it image or video.
   */
  media: string;
  /**
   * Type of the story, `'image'` or `'video'`.
   */
  mediaType: StoryMediaType;
  /**
   * How long the story stays on screen, in milliseconds.
   *
   * For images this defaults to 3000. For videos it defaults to the
   * duration reported by the video itself, and setting it here overrides that.
   */
  duration?: number;
  /**
   * Header component which will be displayed just below animation bars,
   * ideal for avatar, close button and linear gradient.
   * @default null
   */
  header?: ReactNode;
  /**
   * Shows a **See More** button at the bottom which opens this url.
   */
  seeMoreUrl?: string;
  /**
   * HTTP headers sent with the request for `media`, for example an
   * `Authorization` header for protected content. Applied to both images
   * and videos.
   */
  headers?: Record<string, string>;
};

/**
 * Distances, in points, to keep the progress bars and header clear of the top
 * of the screen and the See More button clear of the bottom.
 */
export type SafeAreaInsets = {
  top?: number;
  bottom?: number;
};

/**
 * What `renderImage` receives, so a custom image component can fill the
 * story and drive its loader.
 */
export type RenderImageProps = {
  /** The image to show, with the story's `headers` when it has any. */
  source: { uri: string; headers?: Record<string, string> };
  /** Fills the story; pass it on so the image covers the screen. */
  style: StyleProp<ImageStyle>;
  /** Call when loading begins, to show the loader. */
  onLoadStart: () => void;
  /**
   * Call when the image is on screen (or has failed). The progress bar
   * starts here, so a component that never calls it holds the story until
   * the loading timeout runs out.
   */
  onLoadEnd: () => void;
};
