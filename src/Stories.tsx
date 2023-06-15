import { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    Dimensions,
    TouchableWithoutFeedback,
    Image,
    Animated,
    Pressable,
    SafeAreaView,
    Modal,
} from 'react-native';
import { ResizeMode, Video } from 'expo-av';
import type { Story } from './types';
import type { TextStyle } from 'react-native';
import { Linking } from 'react-native';
import type { ViewStyle } from 'react-native';
import { Platform } from 'react-native';
const { width, height } = Dimensions.get('window');

type StoryType = Story & {
    finish: number
};
type PropTypes = {
    /**
     * An array of story objects
     * @see https://www.npmjs.com/package/rn-story#story-object
     */
    stories: Story[],
    /**
     * Set the current story index.
     */
    currentIndex?: number,
    /**
     * Callback when the user taps/press to go back to the previous story.
     */
    onPrevious?: Function,
    /**
     * Callback when the user taps/press to go back to the previous story but you are on the first story,
     * i.e there are no more stories to go back (suitable for closing story view or update index to show previous profile story)
     */
    onPreviousFirstStory?: Function,
    /**
     * Callback when the user taps/press to proceed to the next story
     */
    onNext?: Function,
    /**
     * Callback when the user taps/press to proceed to next story but you are on the last story,
     *  i.e there are no more stories to go forward (suitable for closing story view or update index to show next story)
     */
    onAllStoriesEnd?: Function,
    /**
     * Control the volume of video.
     */
    videoVolume?: number,
    /**
     * Switch to mute video.
     * @default 1.0
     */
    isMuted?: boolean,
    /**
     * Switch to changed the shape from rectangular animation bar to rounded.
     * @default false
     */
    isAnimationBarRounded?: boolean,
    /**
     * Modify the height of animation bar @default 2
     */
    animationBarHeight?: number,
    /**
     * Modify the color of animation @default "#fff"
     */
    animationBarColor?: string,
    /**
     * Change the text of **See More** button, *required `seeMoreUrl` to be set is Story Object.
     * @default "View Details"
     */
    seeMoreText?: string,
    /**
     * Override the styles of **See More** button container, *required `seeMoreUrl` to be set is Story Object.
     * @default {}
     */
    seeMoreStyles?: ViewStyle,
    /**
     * Override the styles of **See More** button text, *required `seeMoreUrl` to be set is Story Object.
     * @default {}
     */
    seeMoreTextStyles?: TextStyle,
}
export default function Stories({
    stories,
    currentIndex = 0,
    onPrevious,
    onPreviousFirstStory,
    onNext,
    onAllStoriesEnd,
    videoVolume = 1.0,
    isMuted = false,
    isAnimationBarRounded = true,
    animationBarHeight = 2,
    animationBarColor = "#fff",
    seeMoreText = "View Details",
    seeMoreStyles = {},
    seeMoreTextStyles = {}

}: PropTypes) {
    //to hold the stories and add a proeprty finish to keep track of finished stories for animation
    const [content, setContent] = useState<StoryType[]>([]);
    //to check if image/video is ready to play to show a loader
    const [isLoading, setIsLoading] = useState(true);
    //to control video pause and play on long press
    const [shouldPlay, setShouldPlay] = useState(true);
    //to check from which position to resume
    const [position, setPosition] = useState(0);
    //to get the duration
    const [end, setEnd] = useState(0);
    //current is for get the current content is now playing
    const [current, setCurrent] = useState(currentIndex);
    //progress is the animation value of the bars content playing the current state
    const progress = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        //adding a finish property to story object to keep track of which stories are viewed for animation bars
        const _temp: StoryType[] = [];
        stories.forEach(story => {
            _temp.push({ ...story, finish: 0 })
        })
        setContent(_temp);
    }, []);

    // start() is for starting the animation bars at the top
    const start = (n: number) => {
        // checking if the content type is video or not
        if (content[current]?.mediaType == 'video') {
            // type video
            if (!isLoading) {
                Animated.timing(progress, {
                    toValue: 1,
                    duration: n,
                    useNativeDriver: false,
                }).start(({ finished }) => {
                    if (finished) {
                        next();
                    }
                });
            }
        } else {
            // type image
            Animated.timing(progress, {
                toValue: 1,
                duration: content[current]?.duration ? content[current]?.duration : 3000,
                useNativeDriver: false
            }).start(({ finished }) => {
                if (finished) {
                    next();
                }
            });
        }
    }
    // handle playing the animation
    const play = () => {
        start(end);
    }

    const next = () => {
        setPosition(0);
        if (onNext) {
            onNext()
        }
        // check if the next content is not empty
        if (current !== content.length - 1) {
            let _temp = [...content];
            _temp[current].finish = 1;
            setContent(_temp);
            setCurrent(current + 1);
            progress.setValue(0);

        } else {
            // progress.setValue(1);
            if (onAllStoriesEnd) {
                onAllStoriesEnd()
            }
        }

    }

    // previous() is for changing the content of the current content to -1
    const previous = () => {
        setPosition(0);
        progress.setValue(0);
        if (onPrevious)
            onPrevious()
        // checking if the previous content is not empty
        if (current - 1 >= 0) {
            let _temp = [...content];
            _temp[current].finish = 0;
            setContent(_temp);
            setCurrent(current - 1);

        } else {
            // progress.setValue(0);
            start(end);
            if (onPreviousFirstStory) {
                onPreviousFirstStory()
            }

        }
    }

    const longPressHandler = () => {
        progress.stopAnimation((value) => {
            setPosition(end * (value));
        })
        setShouldPlay(false);

    }

    const pressOutHandler = () => {
        setShouldPlay(true);
        start(end);
    }

    return (
        <SafeAreaView style={[styles.container]}>
            {/* MODAL */}
            <Modal animationType="fade" transparent={false} visible={true}>

                <View style={styles.containerModal}>
                    <View style={styles.backgroundContainer}>
                        {/* check the content type is video or an image */}
                        {content[current]?.mediaType == 'video' ? (
                            <Video
                                source={{
                                    uri: content[current]?.media,
                                }}
                                rate={1.0}
                                volume={videoVolume}
                                resizeMode={ResizeMode.COVER}
                                shouldPlay={shouldPlay}
                                isMuted={isMuted}
                                positionMillis={Number.isNaN(position) ? 0 : position}
                                onReadyForDisplay={play}
                                onLoadStart={() => setIsLoading(true)}
                                onPlaybackStatusUpdate={(AVPlaybackStatus) => {
                                    setIsLoading(!AVPlaybackStatus.isLoaded);
                                    //@ts-ignore
                                    setEnd(AVPlaybackStatus.durationMillis);
                                }}
                                style={{ height: height, width: width }}
                            />
                        ) : (
                            <Image
                                onLoadStart={() => setIsLoading(true)}
                                onLoadEnd={() => {
                                    setIsLoading(false)
                                    progress.setValue(0);
                                    play();
                                }}
                                source={{
                                    uri: content[current]?.media,
                                }}
                                style={{ width: width, height: height, resizeMode: 'cover' }}
                            />
                        )}
                    </View>
                    <View style={{
                        flexDirection: 'column',
                        flex: 1,
                    }}>
                        <View
                            style={[styles.topContainer]}
                        >
                            {/* ANIMATION BARS */}
                            <View
                                style={[styles.animationBarsContainer]}>
                                {content.map((item, index) => {
                                    return (
                                        // THE BACKGROUND
                                        <View
                                            key={item.mediaType + index}
                                            style={{
                                                height: animationBarHeight,
                                                borderRadius: isAnimationBarRounded ? 16 : 0,
                                                flex: 1,
                                                flexDirection: 'row',
                                                backgroundColor: 'rgba(117, 117, 117, 0.5)',
                                                marginHorizontal: 2,
                                            }}>
                                            {/* THE ANIMATION OF THE BAR*/}
                                            <Animated.View
                                                style={{
                                                    flex: current == index ? progress : content[index]?.finish,
                                                    height: animationBarHeight,
                                                    backgroundColor: animationBarColor,
                                                    borderRadius: isAnimationBarRounded ? 16 : 0,
                                                }}
                                            />
                                        </View>
                                    );
                                })}
                            </View>
                            {/* END OF ANIMATION BARS */}
                            {/* THE HEADER */} 
                            {content[current]?.header}
                        </View>
                        {/* HERE IS THE HANDLE FOR PREVIOUS AND NEXT PRESS */}
                        <View style={{ flex: 1, flexDirection: 'row', zIndex: -1 }}>
                            <TouchableWithoutFeedback
                                onLongPress={longPressHandler}
                                delayLongPress={150}
                                onPressOut={pressOutHandler}
                                onPress={previous}>
                                <View style={{ flex: 1 }} />
                            </TouchableWithoutFeedback>
                            <TouchableWithoutFeedback
                                onLongPress={longPressHandler}
                                delayLongPress={150}
                                onPressOut={pressOutHandler}
                                onPress={next}>
                                <View style={{ flex: 1 }} />
                            </TouchableWithoutFeedback>
                        </View>
                        {/* END OF THE HANDLE FOR PREVIOUS AND NEXT PRESS */}
                    </View>
                    {isLoading && <Image
                        source={require('./assets/loading.png')}
                        style={{
                            position: 'absolute',
                            height: 60,
                            width: 60,
                            bottom: height / 2,
                            left: width / 2,
                            transform: [
                                { translateX: -30 }
                            ]
                        }} />}
                    {/* SEE MORE COMPONENT */}
                    {content[current]?.seeMoreUrl ? <View style={[styles.seeMoreContainer]}>
                        <Pressable onPress={() => {
                            Linking.openURL(content[current]?.seeMoreUrl || "")

                        }} style={[styles.seeMore, seeMoreStyles]}>
                            <Text style={[{ color: "#fff" }, seeMoreTextStyles]}>{seeMoreText}</Text>
                        </Pressable>
                    </View> : null}
                    {/* END OF SEE MORE COMPONENT */}
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {

    },
    containerModal: {
        height: height,
        backgroundColor: '#000',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flex: 1
    },
    backgroundContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0
    },
    topContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: Platform.OS === "ios" ? 47 : 0,
        height: 100
    },
    animationBarsContainer: {
        flexDirection: 'row',
        paddingTop: 12,
        paddingHorizontal: 12,
    },
    avatarAndIconsContainer: {
        height: 50,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    seeMoreContainer: {
        position: 'absolute',
        alignItems: 'center',
        width: width,
        bottom: 32,
    },
    seeMore: {
        backgroundColor: '#000',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 50
    }
});