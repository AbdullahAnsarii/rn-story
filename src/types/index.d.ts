export type Data = {
    profileName: string;
    profileImage: string;
    id: string | number;
    stories: Story[];
    viewed: boolean;
}

export type Story = {
    media: string;
    mediaType: "image" | "video";
    duration?: number;
    caption?: string;
    date?: Date | string;
    seeMoreUrl?: string
}

