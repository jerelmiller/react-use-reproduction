import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { act, Suspense, use, useDeferredValue, useState } from "react";

/*
 * This test demonstrates an issue somewhere between useDeferredValue, act, and
 * use. This test will timeout in jest despite the fact that each promise
 * resolves in ~10ms.
 *
 * There are a couple changes that make this test pass by speeding up the
 * execution:
 *   - Remove the act() call around user.type('ab') (1)
 *   - Simulate typing individual characters (i.e. user.type('a'), user.type('b')) (2)
 *   - Pass `text` instead of `deferredText` into `<Result />` (3)
 *   - Increase the timeout for the test. It will pass eventually, just not within the default 5s window (4)
 */

test("does not timeout", async () => {
  const cache = new Map<string, Promise<string>>();

  function fetchValue(text: string) {
    if (cache.has(text)) {
      return cache.get(text)!;
    }

    const promise = new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve(text ? text.toUpperCase() : "<empty>");
      }, 10);
    });

    cache.set(text, promise);

    return promise;
  }

  function App() {
    const [text, setText] = useState("");
    const deferredText = useDeferredValue(text);

    return (
      <>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          data-testid="input"
        />
        <Suspense fallback={<div>Loading...</div>}>
          {/* (3) This test will pass if you replace `deferredText` with `text` */}
          <Result text={deferredText} />
        </Suspense>
      </>
    );
  }

  function Result({ text }: { text: string }) {
    const result = use(fetchValue(text));

    return <div data-testid="result">{result}</div>;
  }

  render(<App />);

  const input = screen.getByTestId("input") as HTMLInputElement;

  expect(screen.getByText("Loading...")).not.toBeNull();

  await waitFor(() => {
    expect(screen.getByTestId("result").textContent).toBe("<empty>");
  });

  // Comment this out and uncomment one of the solutions below to see this test
  // pass without timing out
  await act(async () => {
    fireEvent.change(input, { target: { value: "a" } });
    await new Promise((resolve) => setTimeout(resolve, 1));
    fireEvent.change(input, { target: { value: "ab" } });
  });

  // (1) Removing `act` around this helper works.
  // fireEvent.change(input, { target: { value: "a" } });
  // await new Promise((resolve) => setTimeout(resolve, 1));
  // fireEvent.change(input, { target: { value: "ab" } });

  // (2) Removing the timeout also works
  // await act(async () => {
  //   fireEvent.change(input, { target: { value: "a" } });
  //   fireEvent.change(input, { target: { value: "ab" } });
  // });

  await waitFor(
    () => {
      expect(screen.getByTestId("result").textContent).toBe("AB");
    }
    // (4) Add a larger timeout for this test
    // { timeout: 10000 },
  );
  // (4) Add a larger timeout to this test e.g. 15000
  /* 15000 */
});
