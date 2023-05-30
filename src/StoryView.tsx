import React, { useState, useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import {
    StyleSheet,
    Text,
    View,
    Dimensions,
    TouchableWithoutFeedback,
    Image,
    Modal,
    Animated,
    StatusBar,
    Button,
    TouchableOpacity,
    BackHandler,
    Pressable,
} from 'react-native';
import { ResizeMode, Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import type { Data, Story } from './types';
const { width, height } = Dimensions.get('window');
const screenRatio = height / width;

type StoryType = Story & {
    finish: number
};
type PropTypes = {
    data: Data[],
    currentStoryIndex: number,
    setCurrentStoryIndex: Dispatch<SetStateAction<number | null>>,
    setStoriesViewed: Dispatch<SetStateAction<{ id: number, viewed: boolean }[]>>
    storiesViewed: { id: number, viewed: boolean }[]
}
export default function App({ data, currentStoryIndex, setCurrentStoryIndex, setStoriesViewed, storiesViewed }: PropTypes) {
    const [content, setContent] = useState<StoryType[]>([]);
    //to control pause and play on long press
    const [shouldPlay, setShouldPlay] = useState(true);
    //to control mute press
    const [isMuted, setIsMuted] = useState(false);
    //to check from which position to resume
    const [postition, setPosition] = useState(0);
    // for get the duration
    const [end, setEnd] = useState(0);
    // current is for get the current content is now playing
    const [current, setCurrent] = useState(0);
    // if load true then start the animation of the bars at the top
    const [load, setLoad] = useState(false);
    // progress is the animation value of the bars content playing the current state
    const progress = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const _temp: StoryType[] = [];
        data[currentStoryIndex]?.stories.forEach(deal => {
            _temp.push({ ...deal, finish: 0 })
        })
        setContent(_temp);
        console.log('here')
    }, [currentStoryIndex]);

    // start() is for starting the animation bars at the top
    const start = (n: number) => {
        // checking if the content type is video or not
        if (data[currentStoryIndex]?.stories[current]?.mediaType == 'video') {
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
                duration: 5000,
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

    // next() is for changing the content of the current content to +1
    const next = () => {
        setPosition(0);
        // check if the next content is not empty
        if (current !== content.length - 1) {
            let data = [...content];
            data[current].finish = 1;
            setContent(data);
            setCurrent(current + 1);
            progress.setValue(0);
            setLoad(false);
        } else {
            // the next content is empty and there are other stories remaining
            if (currentStoryIndex < data.length - 1) {
                setCurrentStoryIndex(currentStoryIndex + 1);
                setCurrent(0);
                progress.setValue(0);
                setLoad(false);
            }
            else {
                close();
            }
            // if (current === data[currentStoryIndex]?.stories.length - 1) {
            const viewiedStories = [...storiesViewed]
            const updatedViewedStories = viewiedStories.map(viewedStory => {
                if (viewedStory.id === data[currentStoryIndex]?.id) {
                    return { ...viewedStory, viewed: true }; // Creating a new object with the updated value
                }
                return viewedStory;
            });
            setStoriesViewed(updatedViewedStories)
            // }
        }
    }

    // previous() is for changing the content of the current content to -1
    const previous = () => {
        // checking if the previous content is not empty
        if (current - 1 >= 0) {
            setPosition(0);
            let _data = [...content];
            _data[current].finish = 0;
            setContent(_data);
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
        setCurrentStoryIndex(null);
        setPosition(0);
        progress.setValue(0);
        setLoad(false);
        setCurrent(0);
        setContent([]);
        setShouldPlay(false);
    }

    return (
        <View style={styles.containerModal}>
            <View style={styles.backgroundContainer}>
                {/* check the content type is video or an image */}
                {content[current]?.mediaType == 'video' ? (
                    <Video
                        source={{
                            uri: content[current]?.media || "",
                        }}
                        rate={1.0}
                        volume={1.0}
                        resizeMode={ResizeMode.COVER}
                        shouldPlay={true}
                        positionMillis={0}
                        // I WAS THINKING TO GET THE VIDEO THUMBNAIL BEFORE THE VIDEO LOADS UP
                        // posterSource={{
                        // 	uri: content[current].thumbnail,
                        // }}
                        // posterStyle={{
                        // 	width: width,
                        // 	height: height,
                        // }}
                        // usePoster
                        onReadyForDisplay={play}
                        onPlaybackStatusUpdate={(AVPlaybackStatus) => {
                            // console.log(AVPlaybackStatus);
                            setLoad(AVPlaybackStatus.isLoaded);
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
            <View
                style={{
                    flexDirection: 'column',
                    flex: 1,
                }}
            >
                <LinearGradient
                    colors={['rgba(0,0,0,1)', 'transparent']}
                    style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: 0,
                        height: 100,
                    }}
                />
                {/* ANIMATION BARS */}
                <View
                    style={{
                        flexDirection: 'row',
                        paddingTop: 12,
                        paddingHorizontal: 12,
                    }}>
                    {content.map((index, key) => {
                        return (
                            // THE BACKGROUND
                            <View
                                key={key}
                                style={{
                                    height: 2,
                                    borderRadius: 16,
                                    flex: 1,
                                    flexDirection: 'row',
                                    backgroundColor: 'rgba(117, 117, 117, 0.5)',
                                    marginHorizontal: 2,
                                }}>
                                {/* THE ANIMATION OF THE BAR*/}
                                <Animated.View
                                    style={{
                                        flex: current == key ? progress : content[key]?.finish,
                                        height: 2,
                                        backgroundColor: "#fff",
                                    }}
                                />
                            </View>
                        );
                    })}
                </View>
                {/* END OF ANIMATION BARS */}

                <View
                    style={{
                        height: 50,
                        flexDirection: 'row',

                        justifyContent: 'space-between',
                        paddingHorizontal: 15,
                    }}
                >
                    {/* THE AVATAR AND USERNAME  */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 8 }}>
                        {/* <FastImage */}
                        <Image
                            style={{ height: 36, width: 36, borderRadius: 25 }}
                            source={{
                                uri: data[currentStoryIndex]?.profileImage
                            }}
                        />
                        <View style={{ alignItems: 'center' }}>
                            <Text
                                numberOfLines={1}
                                style={{ width: Dimensions.get('window').width / 1.5, paddingLeft: 12, color: "#fff" }}>
                                {data[currentStoryIndex]?.profileName}
                            </Text>
                            {/* <Text numberOfLines={1}
                                style={{ width: Dimensions.get('window').width / 1.5, paddingLeft: 12, color: "#fff" }}>
                                {timeSince(data[currentStoryIndex]?.stories[current]?.date)}
                            </Text> */}
                        </View>
                    </View>
                    {/* END OF THE AVATAR AND USERNAME */}
                     {/* Mute Button */}
                     {content[current]?.mediaType == 'video' && <Pressable
                        onPress={() => setIsMuted(!isMuted)}>
                        <View
                            style={{
                                alignItems: 'center',
                                justifyContent: 'center',

                                height: 50,
                                marginRight: 10,
                            }}>
                            {isMuted ? <Text>unmute</Text> : <Text>mute</Text>}
                        </View>
                    </Pressable>}
                    {/* THE CLOSE BUTTON */}
                    <TouchableOpacity
                        onPress={() => {
                            close();
                        }}
                    >
                        <View
                            style={{
                                alignItems: 'center',
                                justifyContent: 'center',

                                height: 50,
                                paddingHorizontal: 15,
                            }}
                        >
                            <Text>close</Text>
                        </View>
                    </TouchableOpacity>
                    {/* END OF CLOSE BUTTON */}
                </View>
                {/* HERE IS THE HANDLE FOR PREVIOUS AND NEXT PRESS */}
                <View style={{ flex: 1, flexDirection: 'row' }}>
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
        </View>
    );
}

const styles = StyleSheet.create({
    containerModal: {
        paddingTop: StatusBar.currentHeight,
        height: Dimensions.get("window").height,
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
});