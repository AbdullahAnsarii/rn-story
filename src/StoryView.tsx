import { useState, useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import {
    StyleSheet,
    Text,
    View,
    Dimensions,
    TouchableWithoutFeedback,
    Image,
    Animated,
    StatusBar,
    Pressable,
    SafeAreaView,
} from 'react-native';
import Mute from './assets/Mute';
import Unmute from './assets/Unmute';
import Close from './assets/Close';
import Open from './assets/Open';
import { ResizeMode, Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import type { Data, Story } from './types';
import { timeSince } from './helpers/timesince';
import type { ImageStyle } from 'react-native';
import type { TextStyle } from 'react-native';
import { Linking } from 'react-native';
import type { ViewStyle } from 'react-native';
const { width, height } = Dimensions.get('window');

type StoryType = Story & {
    finish: number
};
type PropTypes = {
    stories: Data[],
    setStories: Dispatch<SetStateAction<Data[]>>,
    currentStoryIndex: number,
    setCurrentStoryIndex: Dispatch<SetStateAction<number | null>>,
    imageStoryDuration?: number,
    videoVolume?: number,
    isAnimationBarRounded?: boolean,
    animationBarHeight?: number,
    animationBarColor?: string,
    headerGradientTransparency?: number,
    iconSize?: number,
    iconColor?: string,
    storyViewProfileImageStyles?: ImageStyle,
    storyViewProfileNameStyles?: TextStyle,
    seeMoreLink?: string,
    seeMoreText?: string,
    seeMoreContainerStyles?: ViewStyle,
    seeMoreStyles?: ViewStyle,
    seeMoreTextStyles?: TextStyle,
    seeMoreIconSize?: number,
    seeMoreIconColor?: string,
}
export default function App({
    stories,
    setStories,
    currentStoryIndex,
    setCurrentStoryIndex,
    imageStoryDuration,
    videoVolume = 1.0,
    isAnimationBarRounded = true,
    animationBarHeight = 2,
    animationBarColor = "#fff",
    headerGradientTransparency = 0.75,
    iconSize = 24,
    iconColor = "#fff",
    storyViewProfileImageStyles,
    storyViewProfileNameStyles,
    seeMoreText = "View Details",
    seeMoreContainerStyles,
    seeMoreStyles,
    seeMoreTextStyles,
    seeMoreIconSize = 18,
    seeMoreIconColor = "#fff"

}: PropTypes) {
    //to hold the stories and add a proeprty finish to keep track of finished stories for animation
    const [content, setContent] = useState<StoryType[]>([]);
    //to control pause and play on long press
    const [shouldPlay, setShouldPlay] = useState(true);
    //to control mute press
    const [isMuted, setIsMuted] = useState(false);
    //to check from which position to resume
    const [position, setPosition] = useState(0);
    //to get the duration
    const [end, setEnd] = useState(0);
    // current is for get the current content is now playing
    const [current, setCurrent] = useState(0);
    // if load true then start the animation of the bars at the top
    const [load, setLoad] = useState(false);
    // progress is the animation value of the bars content playing the current state
    const progress = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (currentStoryIndex !== null) {
            const _temp: StoryType[] = [];
            stories[currentStoryIndex]?.stories.forEach(deal => {
                _temp.push({ ...deal, finish: 0 })
            })
            setContent(_temp);
        }
    }, [currentStoryIndex]);

    // start() is for starting the animation bars at the top
    const start = (n: number) => {
        // checking if the content type is video or not
        if (stories[currentStoryIndex]?.stories[current]?.mediaType == 'video') {
            // type video
            if (load) {
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
                duration: imageStoryDuration ? imageStoryDuration : 3000,
                useNativeDriver: false
            }).start(({ finished }) => {
                if (finished && currentStoryIndex !== null) {
                    next();
                }
            });
        }
    }

    // handle playing the animation
    const play = () => {
        start(end);
    }
    //handle story seen on all individual stories viewed
    const storySeen = () => {
        // Find the index of the object you want to update
        const index = stories.findIndex(obj => obj.id === stories[currentStoryIndex]?.id);
        // Create a copy of the original array
        const updatedArray = [...stories];
        // Updating viewed to true
        const updatedObject: Data = { ...updatedArray[index], viewed: true };
        // Replace the old object with the updated copy
        updatedArray[index] = updatedObject;
        // Set the updated array as the new state or use it in your component
        setStories(updatedArray);
    }
    // next() is for changing the content of the current content to +1
    const next = () => {
        setPosition(0);
        // check if the next content is not empty
        if (current !== content.length - 1) {
            let _temp = [...content];
            _temp[current].finish = 1;
            setContent(_temp);
            setCurrent(current + 1);
            progress.setValue(0);
            setLoad(false);
        } else {
            // the next content is empty and there are other stories remaining
            if (currentStoryIndex < stories.length - 1) {
                setCurrentStoryIndex(currentStoryIndex + 1);
                setCurrent(0);
                progress.setValue(0);
                setLoad(false);
            }
            else {
                close();
            }
            storySeen()
        }
    }

    // previous() is for changing the content of the current content to -1
    const previous = () => {
        // checking if the previous content is not empty
        if (current - 1 >= 0) {
            setPosition(0);
            let _temp = [...content];
            _temp[current].finish = 0;
            setContent(_temp);
            setCurrent(current - 1);
            progress.setValue(0);
            setLoad(false);
        } else {
            // the previous content is empty and there are other stories remaining
            if (current === 0 && currentStoryIndex !== 0) {
                setCurrentStoryIndex(currentStoryIndex - 1);
                setCurrent(0);
                progress.setValue(0);
                setLoad(false);
            }
            else {
                close();
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
    // closing the modal set the animation progress to 0
    const close = () => {
        if (current === content.length - 1) {
            storySeen()
        }
        setCurrentStoryIndex(null);
        setPosition(0);
        progress.setValue(0);
        setLoad(false);
        setCurrent(0);
        setContent([]);
        setShouldPlay(false);
    }

    return (
        <SafeAreaView style={styles.containerModal}>
            <StatusBar barStyle='default' />
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
                        onPlaybackStatusUpdate={(AVPlaybackStatus) => {
                            setLoad(AVPlaybackStatus.isLoaded);
                            //@ts-ignore
                            setEnd(AVPlaybackStatus.durationMillis);
                        }}
                        style={{ height: height, width: width }}
                    />
                ) : (
                    <Image
                        onLoadEnd={() => {
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
                <LinearGradient
                    //prop
                    colors={[`rgba(0,0,0,${headerGradientTransparency})`, 'transparent']}
                    style={[styles.linearGradient]}
                />
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

                    <View style={[styles.avatarAndIconsContainer]}>
                        {/* THE AVATAR AND USERNAME  */}
                        <View style={styles.avatarAndProfileContainer}>
                            <Image
                                style={[styles.profileImage, storyViewProfileImageStyles]}
                                source={{
                                    uri: stories[currentStoryIndex]?.profileImage
                                }} />
                            <View>
                                <Text
                                    numberOfLines={1}
                                    style={[{ width: width / 1.75 }, styles.profileName, storyViewProfileNameStyles]}>
                                    {stories[currentStoryIndex]?.profileName}
                                </Text>
                                {stories[currentStoryIndex]?.stories[current]?.date ?
                                    <Text numberOfLines={1}
                                        style={[{ width: width / 1.75 }, styles.uploadedAt]}>
                                        {timeSince(stories[currentStoryIndex]?.stories[current]?.date)}
                                    </Text> : null}
                            </View>
                        </View>
                        {/* END OF THE AVATAR AND USERNAME */}

                        <View style={styles.iconContainer}>
                            {/* MUTE BUTTON */}
                            {content[current]?.mediaType == 'video' && <Pressable onPress={() => setIsMuted(!isMuted)}>
                                {isMuted ? <Unmute height={iconSize} width={iconSize} fill={iconColor} stroke={iconColor} />
                                    : <Mute height={iconSize} width={iconSize} fill={iconColor} stroke={iconColor} />}
                            </Pressable>}
                            {/* END OF MUTE BUTTON */}
                            {/* THE CLOSE BUTTON */}
                            <Pressable style={{ marginLeft: 12 }} onPress={close}>
                                <Close height={iconSize} width={iconSize} fill={iconColor} stroke={iconColor} />
                            </Pressable>
                            {/* END OF CLOSE BUTTON */}
                        </View>
                    </View>


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
            
            {/* SEE MORE COMPONENT */}
            {stories[currentStoryIndex]?.stories[current]?.seeMoreUrl ? <View style={[styles.seeMoreContainer, seeMoreContainerStyles]}>
                <Pressable onPress={() => {
                    Linking.openURL(stories[currentStoryIndex]?.stories[current]?.seeMoreUrl || "")

                }} style={[styles.seeMore, seeMoreStyles]}>
                    <Open
                        height={seeMoreIconSize}
                        width={seeMoreIconSize}
                        fill={seeMoreIconColor}
                        style={{ marginRight: 4 }} />
                    <Text style={[{ color: "#fff" }, seeMoreTextStyles]}>{seeMoreText}</Text>
                </Pressable>
            </View> : null}
            {/* END OF SEE MORE COMPONENT */}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    containerModal: {
        paddingTop: StatusBar.currentHeight,
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
    linearGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: 120,
    },
    topContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 40,
        height: 100,
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
    avatarAndProfileContainer: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    profileImage: {
        height: 36,
        width: 36,
        borderRadius: 25
    },
    profileName: {
        color: "#fff",
        marginLeft: 12
    },
    uploadedAt: {
        color: "#fff",
        marginLeft: 12
    },
    iconContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    seeMoreContainer: {
        position: 'absolute',
        alignItems: 'center',
        width: width,
        bottom: 32,
    },
    seeMore: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#000',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 50
    }
});