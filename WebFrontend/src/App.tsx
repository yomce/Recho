import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import AppRouter from "./routes/AppRouter";
import Navigation from "./components/layout/Navigation";
import "./App.css";
import "./index.css";

function App() {
  return (
    <Router>
      <div className="">
        <AppRouter />
        <Navigation />
      </div>
    </Router>
  );
}

export default App;
