
<h1 style="margin: 0" align="center">rn-story</h1>
<p align="center">React Native component for stories like instagram, whatsapp and snapchat</p>

<img height="600" src="https://firebasestorage.googleapis.com/v0/b/fir-demo-48533.appspot.com/o/rn-story-preview.png?alt=media&token=5a0aada6-f69f-4a06-8f6f-cf7ffef79ded" alt="Demo screenshot"/>

 ---

## Installation

  

```sh

npm install rn-story

```

  

## Usage

  

```jsx

import  Stories  from  'rn-story';

//minimal usage
<Stories  stories={stories}  />

```

## Live Preview
Check out the live preview and play with the package on Snack
https://snack.expo.dev/@abdullahansari/rn-story


## Props

| Property               | Type            | Default                   | Description                                                                                                                                                         |
| ---------------------- | --------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stories`              | StoryType[] | `required`                | An array of story objects [StoryType object](#story-object) 
| **Optional props**          | ⭐️             | ⭐️                 | ⭐️                                                                                                                                                                 |                                                                                   
| `currentIndex`         | number        | `0`                      | Set the current story index                                                                                                              |
| `isMuted`      | boolean          | `false`                      | Switch to mute video story                                                                                                                    |
| `videoVolume`   | number         | `1.0`                     | Control the volume of video       |
| `isAnimationBarRounded`               | boolean       | `true`                                                                                                     | Switch to changed the shape from rectangular animation bar to rounded
| `animationBarHeight`               | number       | `2` | Modify the height of animation bar |
| `animationBarColor` | string          | `#fff`         | Modify the color of animation bar                                                                                                                |
| `seeMoreText`                | string   | "View Details"                      | Change the text of **See More** button, *required `seeMoreUrl` to be set is Story Object.*                                                                                                         |
| `seeMoreStyles`               | ViewStyle   | `{}`    | Override the styles of **See More** button container, *required `seeMoreUrl` to be set is Story Object.*                                                                                                          |
| `seeMoreTextStyles`          | TextStyle          | `{}`                  | Override the styles of **See More** button text, *required `seeMoreUrl` to be set is Story Object.*                                                                                                                 |
| `onPrevious`         | Function        | -                         | Callback when the user taps/press to proceed to the previous story                                                                                                                                         |
| `onPreviousEnd`           | Function        | -                         | Callback when the user taps/press to proceed to the previous story but you are on the first story, i.e there are no more stories to go back                                                                                                                                         |
| `onNext`               | Function        | -                         | Callback when the user taps/press to proceed to the next story                                                                                                                   |
| `onNextEnd`           | Function        | -                         | Callback when the user taps/press to go back to the previous story but you are on the first story, i.e there are no more stories to go back                                                                                                                  |


### Story object

A simple 'story object' needs to be passed in the `stories` array.

| Property           | Description                                                                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `media`              | The url of the resource, be it image or video.                                                                                                |
| `mediaType`             |  Type of the story. `type: 'video'                                                                                                   | 'image'`. Type `video` is necessary for a video story. |
| `duration?`         | Optional. Duration for which a story should persist.                                                                                          |
| `header`           | Optional. Adds a header on the top. Object with `heading`, `subheading` and `profileImage` properties.                                        |
| `seeMoreUrl`          | Optional. Shows the See More button at the bottom and adds the url for that button as well.



## Contributing

  

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

  

## License

  

MIT © [AbdullahAnsarii](https://github.com/AbdullahAnsarii)

Check out more projects at https://abdullahansari.me