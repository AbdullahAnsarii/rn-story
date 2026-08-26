import type { ReactNode } from 'react';

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
};
