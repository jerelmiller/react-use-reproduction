import { useState, use, useRef, Suspense, useDeferredValue } from "react";
import { userEvent } from "@testing-library/user-event";
import "./App.css";

let count = 0;
const user = userEvent.setup();
const cache = new Map<string, Promise<number>>();

function fetchNextNumber(text: string) {
  if (cache.has(text)) {
    return cache.get(text)!;
  }

  const nextCount = count++;
  const promise = new Promise<number>((resolve) => {
    setTimeout(() => {
      resolve(nextCount);
    }, 2000);
  });

  cache.set(text, promise);

  return promise;
}

function App() {
  const ref = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const deferredText = useDeferredValue(text);
  console.log({ text, deferredText });

  return (
    <>
      <input
        ref={ref}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button onClick={async () => await user.type(ref.current!, "ab")}>
        Update using userEvent
      </button>
      <Suspense fallback={<div>Loading count...</div>}>
        <Count text={deferredText} />
      </Suspense>
    </>
  );
}

function Count({ text }: { text: string }) {
  const count = use(fetchNextNumber(text));

  return <div>Number: {count}</div>;
}

export default App;
