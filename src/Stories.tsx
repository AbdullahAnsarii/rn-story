import { useState } from 'react';
import {
    StyleSheet,
    View,
    Image,
    Text,
    RefreshControl,
    ScrollView,
    Pressable,
    SafeAreaView,
    StatusBar
} from 'react-native';
import type { Data } from './types';
import StoryView from './StoryView';

export default function Stories() {
    const [data, setData] = useState<Data[]>([
        {
            profileImage:
                'https://firebasestorage.googleapis.com/v0/b/instagram-clone-f3106.appspot.com/o/ylKTg2Mg_400x400.jpg?alt=media&token=3075b901-6080-4ea7-b539-fdfad1f8a36d',
            profileName: 'image',
            isWatched: false,
            id: 1,
            stories: [
                {
                    media: 'https://firebasestorage.googleapis.com/v0/b/fir-demo-48533.appspot.com/o/1-1.jpg?alt=media&token=91d1f0f4-cf45-41ee-9a51-08b348093b92&_gl=1*87eejn*_ga*MTYwNzQ2OTU4Mi4xNjgxNjQ2NDk5*_ga_CW55HF8NVT*MTY4NTQ1MDE3NC4xMi4xLjE2ODU0NTIxMTYuMC4wLjA',
                    mediaType: 'image',
                },
                {
                    media: 'https://firebasestorage.googleapis.com/v0/b/fir-demo-48533.appspot.com/o/1-2.jpg?alt=media&token=213211d6-d1e6-4b41-bb58-0f23ecaf071e&_gl=1*17ngmn8*_ga*MTYwNzQ2OTU4Mi4xNjgxNjQ2NDk5*_ga_CW55HF8NVT*MTY4NTQ1MDE3NC4xMi4xLjE2ODU0NTIxNDEuMC4wLjA',
                    mediaType: 'image',
                },
                {
                    media: 'https://firebasestorage.googleapis.com/v0/b/fir-demo-48533.appspot.com/o/1-3.jpeg?alt=media&token=4707dc6f-4a76-4a9d-8a6f-25018bd39ca3&_gl=1*1js6o8c*_ga*MTYwNzQ2OTU4Mi4xNjgxNjQ2NDk5*_ga_CW55HF8NVT*MTY4NTQ1MDE3NC4xMi4xLjE2ODU0NTIxNzQuMC4wLjA',
                    mediaType: 'image',
                },
            ]
        },
        {
            profileImage:
                'https://firebasestorage.googleapis.com/v0/b/instagram-clone-f3106.appspot.com/o/ylKTg2Mg_400x400.jpg?alt=media&token=3075b901-6080-4ea7-b539-fdfad1f8a36d',
            profileName: 'image',
            isWatched: false,
            id: 2,
            stories: [
                {
                    media: 'https://firebasestorage.googleapis.com/v0/b/fir-demo-48533.appspot.com/o/2-1.mp4?alt=media&token=11343c81-7f87-4e5b-ab30-39c044896ed2&_gl=1*1stfme0*_ga*MTYwNzQ2OTU4Mi4xNjgxNjQ2NDk5*_ga_CW55HF8NVT*MTY4NTQ1MDE3NC4xMi4xLjE2ODU0NTIyMDguMC4wLjA',
                    mediaType: 'video',
                },
                {
                    media: 'https://firebasestorage.googleapis.com/v0/b/fir-demo-48533.appspot.com/o/2-2.jpeg?alt=media&token=9267a48c-75be-4705-8c4c-5aa65c4a4a48&_gl=1*8mcrey*_ga*MTYwNzQ2OTU4Mi4xNjgxNjQ2NDk5*_ga_CW55HF8NVT*MTY4NTQ1MDE3NC4xMi4xLjE2ODU0NTIyMTMuMC4wLjA',
                    mediaType: 'image',
                },
                {
                    media: 'https://firebasestorage.googleapis.com/v0/b/fir-demo-48533.appspot.com/o/2-3.mp4?alt=media&token=952913cd-f51d-4b14-8edc-7e733fb6007c&_gl=1*lscv55*_ga*MTYwNzQ2OTU4Mi4xNjgxNjQ2NDk5*_ga_CW55HF8NVT*MTY4NTQ1MDE3NC4xMi4xLjE2ODU0NTIyMTcuMC4wLjA',
                    mediaType: 'video',
                },
            ]
        },
        {
            profileImage:
                'https://firebasestorage.googleapis.com/v0/b/instagram-clone-f3106.appspot.com/o/ylKTg2Mg_400x400.jpg?alt=media&token=3075b901-6080-4ea7-b539-fdfad1f8a36d',
            profileName: 'image',
            isWatched: false,
            id: 3,
            stories: [
                {
                    media: 'https://firebasestorage.googleapis.com/v0/b/fir-demo-48533.appspot.com/o/3-3.jpeg?alt=media&token=364a85b9-97d6-4761-a25d-91e4e493e198&_gl=1*1kh5br9*_ga*MTYwNzQ2OTU4Mi4xNjgxNjQ2NDk5*_ga_CW55HF8NVT*MTY4NTQ1MDE3NC4xMi4xLjE2ODU0NTIyNzEuMC4wLjA',
                    mediaType: 'image',
                },
                {
                    media: 'https://firebasestorage.googleapis.com/v0/b/fir-demo-48533.appspot.com/o/3-1.mp4?alt=media&token=a99ff8d7-022d-43d1-bb31-dc85de7da75f&_gl=1*nm8mzg*_ga*MTYwNzQ2OTU4Mi4xNjgxNjQ2NDk5*_ga_CW55HF8NVT*MTY4NTQ1MDE3NC4xMi4xLjE2ODU0NTIyNTQuMC4wLjA',
                    mediaType: 'video',
                },
            ]
        },
    ]);
    const [storiesViewed, setStoriesViewed] = useState<{ id: number, viewed: boolean }[]>([]);
    const [currentStoryIndex, setCurrentStoryIndex] = useState<number | null>(null);

    return (
        <>
            <ScrollView
            // refreshControl={
            //     <RefreshControl tintColor={COLORS.border} colors={[COLORS.border]} refreshing={isLoading} onRefresh={getDeals} />}
            >
                {data?.map((item, index) => {
                    return (
                        <Pressable
                            onPress={() => setCurrentStoryIndex(index)} key={`story-` + index}
                            style={styles.storyContainer}>
                            <View
                                style={[styles.imageContainer,
                                storiesViewed.find((storyViewed) => storyViewed.id === item.id)?.viewed === true ? styles.viewed : undefined]}>
                                <Image
                                    style={styles.storyImage}
                                    resizeMode={"cover"}
                                    source={{ uri: item?.profileImage }}
                                />
                            </View>
                            <Text numberOfLines={1} style={{}}>{item?.profileName}</Text>
                        </Pressable>
                    )
                })}
            </ScrollView>
            {currentStoryIndex !== null &&
                <StoryView
                    data={data}
                    currentStoryIndex={currentStoryIndex}
                    setCurrentStoryIndex={setCurrentStoryIndex}
                    storiesViewed={storiesViewed}
                    setStoriesViewed={setStoriesViewed} />}
        </>
    );
}

const styles = StyleSheet.create({
    storyContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        // backgroundColor: COLORS.white,
        padding: 16,
        borderBottomWidth: 1,
        // borderBottomColor: COLORS.borderSub
    },
    imageContainer: {
        borderWidth: 2,
        // borderColor: COLORS.ypRed,
        borderRadius: 50,
        marginRight: 16,
        padding: 2
    },
    viewed: {
        // borderColor: COLORS.facebookBg
    },
    storyImage: {
        height: 60,
        width: 60,
        borderRadius: 50
    },
});