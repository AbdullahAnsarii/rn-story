# rn-story demo

Live demo of [rn-story](https://github.com/AbdullahAnsarii/rn-story) — Instagram-style stories for React Native and Expo.

Open it in Snack: https://snack.expo.dev/@abdullahansari/rn-story-demo

Tap an avatar to open its stories. Tap right/left to navigate, long-press to pause.

The snack is pinned to **Expo SDK 54 and rn-story 2.x (`expo-av`)** on purpose: Snack's
web player cannot load `expo-video` (its bundle needs `@react-native/assets-registry`,
which the runtime does not provide) and Snack currently stops at SDK 55, which today's
Expo Go no longer runs. Once Snack supports SDK 57, switch `package.json` here to
`expo-video` + `rn-story ^3` and bump the SDK in the editor — `App.tsx` needs no changes.
To try 3.x on a phone in the meantime, run the [example app](../example) in Expo Go.

This directory is the demo's source of truth. The published snack is owned by
the `@abdullahansari` Expo account, so after changing `App.tsx` here, open the
snack while logged in, paste the new contents, and hit Save — the URL stays the
same. If the account copy is ever lost, republish anonymously with
[`snack-sdk`](https://www.npmjs.com/package/snack-sdk)
(`new Snack({ files, dependencies, sdkVersion }).saveAsync()`) and update the
URL here and in the root README.
