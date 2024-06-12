import { useState, use, Suspense, useDeferredValue } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";

let count = 0;
const cache = new Map<string, Promise<number>>();

function fetchNextNumber(text: string) {
  if (cache.has(text)) {
    return cache.get(text)!;
  }

  const nextCount = count++;
  const promise = new Promise<number>((resolve) => {
    setTimeout(() => {
      resolve(nextCount);
    }, 5000);
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
      />
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
