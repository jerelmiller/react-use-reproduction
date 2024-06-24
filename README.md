# React `use` bug in tests

Reproduction for the React 19 bug originally reported in https://github.com/facebook/react/issues/29855.

This bug does not seem to affect app code, but does show up in a testing
environment. See the comments in the [App.test.tsx](./src/App.test.tsx) file for
ways that the test passes without timing out.

## Running the example

1. Install deps

```
npm install
```

2. Run tests

```
npm test
```

You should see the test timeout after ~5s (the default jest timeout). Make any
of the changes from the comments to see the test pass without timing out.

## Running the app in a browser

To compare against a browser environment, you can run the app with the
following.

> [!NOTE]
> The bug does not seem to show up in the browser, despite trying to mimic
> the test as much as possible (i.e. user event timing).

```
npm run dev
```

Try clicking the button next to the input to programatically trigger a change.
The `onChange` handler will fire twice before the `useDeferredValue` value is
changed to the new type much like you see in a test environment. Note that the
behavior here works as expected and does not have any unnecessary slowness.
