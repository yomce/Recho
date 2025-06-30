import React from "react";
import AppRouter from "./routes/AppRouter";
import "./App.css";
import StyleGuideTest from './components/StyleGuideTest';
import "./index.css";

function App() {
  return (
    <div className="">
      <AppRouter />
      <StyleGuideTest />
    </div>
  );
}

export default App;
