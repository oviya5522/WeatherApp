import { useState } from "react";
import "./App.css";
import { Weather } from "./components/Weather";
import SearchHistory from "./components/SearchHistory";

function App() {
  return (
    <div className="">
      <div >
        <Weather />
        {/* <SearchHistory /> */}
      </div>
    </div>
  );
}

export default App;
