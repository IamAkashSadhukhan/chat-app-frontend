import React from "react";
import { Route, Routes } from "react-router";
import ChatPage from "../components/chatPage";
import App from "../App";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/chat" element={<ChatPage />} />
    </Routes>
  );
};

export default AppRoutes;
