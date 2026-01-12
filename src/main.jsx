import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter, Route, Routes } from "react-router";
import AppRoutes from "./config/Routes.jsx";
import toast, { Toaster } from 'react-hot-toast';
import { ChatProvider } from "./context/ChatContext.jsx";

createRoot(document.getElementById("root")).render(
  
    <BrowserRouter>
   <Toaster position="top-right" />
      <ChatProvider>
        <AppRoutes/>
      </ChatProvider>
    </BrowserRouter>
 
);
