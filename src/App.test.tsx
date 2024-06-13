import { render, screen, waitFor } from "@testing-library/react";
import { act, Suspense, use, useDeferredValue, useState } from "react";
import { userEvent } from "@testing-library/user-event";

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
 */

test("does not timeout", async () => {
  const cache = new Map<string, Promise<string>>();
  const user = userEvent.setup();

  function fetchNextNumber(text: string) {
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
    const result = use(fetchNextNumber(text));

    return <div data-testid="result">{result}</div>;
  }

  render(<App />);

  const input = screen.getByTestId("input");

  expect(screen.getByText("Loading...")).not.toBeNull();

  await waitFor(() => {
    expect(screen.getByTestId("result").textContent).toBe("<empty>");
  });

  // Comment this out and uncomment one of the solutions below to see this test
  // pass without timing out
  await act(() => user.type(input, "ab"));

  // (1) Removing `act` around this helper works.
  // await user.type(input, "ab");

  // (2) Typing each keystroke separately also makes this test pass
  // await act(() => user.type(input, 'a'))
  // await act(() => user.type(input, 'b'))

  await waitFor(() => {
    expect(screen.getByTestId("result").textContent).toBe("AB");
  });
});
