/* eslint-env jest */

// expo-video is native, so under jest it is replaced by a small fake: the
// video view is a plain View that keeps its props, and players are inert
// objects that record what was done to them and let tests fire the events a
// real player would emit. Mocks are plain functions rather than jest.fn() so
// that `jest.restoreAllMocks()` in a test cannot strip their implementations.
jest.mock('expo-video', () => {
  const React = require('react');
  const { View } = require('react-native');

  class FakeVideoPlayer {
    constructor(source) {
      this.source = source;
      this.status = 'loading';
      this.duration = 0;
      this.currentTime = 0;
      this.playing = false;
      this.muted = false;
      this.volume = 1;
      this.loop = false;
      this.timeUpdateEventInterval = 0;
      this.released = false;
      /** Every method called on the player, in order. */
      this.calls = [];
      this.listeners = new Map();
    }

    addListener(name, listener) {
      if (!this.listeners.has(name)) {
        this.listeners.set(name, new Set());
      }
      this.listeners.get(name).add(listener);
      return { remove: () => this.listeners.get(name)?.delete(listener) };
    }

    /** Test helper: deliver an event as the native player would. */
    emit(name, payload) {
      Array.from(this.listeners.get(name) ?? []).forEach((listener) =>
        listener(payload)
      );
    }

    /** Test helper: move to a status and announce it. */
    setStatus(status, error) {
      const oldStatus = this.status;
      this.status = status;
      this.emit('statusChange', { status, oldStatus, error });
    }

    play() {
      this.calls.push('play');
      this.playing = true;
    }

    pause() {
      this.calls.push('pause');
      this.playing = false;
    }

    replay() {
      this.calls.push('replay');
      this.currentTime = 0;
    }

    release() {
      this.calls.push('release');
      this.released = true;
      this.listeners.clear();
    }
  }

  const players = [];

  return {
    /** Every player created so far, oldest first. Cleared by `__reset`. */
    __players: players,
    __reset: () => {
      players.length = 0;
    },
    createVideoPlayer: (source) => {
      const player = new FakeVideoPlayer(source);
      players.push(player);
      return player;
    },
    VideoView: (props) => React.createElement(View, props),
  };
});

// StatusBar batches its native updates with setImmediate. Under fake timers
// that immediate outlives the test that scheduled it and can stall the next
// one's hooks, and nothing here needs the native call anyway.
const { StatusBar } = require('react-native');
StatusBar._updatePropsStack = () => {};
