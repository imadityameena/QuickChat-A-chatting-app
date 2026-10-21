import React, { useContext } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import { AuthContext } from "../context/AuthContext";

const App = () => {
  const { authUser, authLoading } = useContext(AuthContext);

  return (
    <div className="bg-[url('/bgImage.svg')] bg-cover bg-center min-h-screen">
      <Toaster
        toastOptions={{ style: { background: "#282142", color: "#fff" } }}
      />
      {authLoading ? (
        // Wait for the saved session check so refreshes don't bounce to /login
        <div className="h-screen flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-violet-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <Routes>
          <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
          <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
          <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      )}
    </div>
  );
};

export default App;
