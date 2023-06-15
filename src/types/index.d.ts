export type Story = {
    media: string;
    mediaType: "image" | "video";
    duration?: number;
      /**
     * Header component which will be displayed just below animation bars, ideal for avatar, close button and linear gradient.
     * @default null
     */
    header?: JSX.Element;
    seeMoreUrl?: string;
}

