export type Data = {
    profileName: string;
    profileImage: string;
    id: string | number;
    isWatched: boolean;
    stories: Story[];
}

export type Story = {
    media: string;
    mediaType: "image" | "video";
    caption?: string;
    date?: Date;
}
