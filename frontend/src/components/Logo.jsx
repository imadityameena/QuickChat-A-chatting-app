import React from "react";
import assets from "../assets/assets";

// App logo: icon + wordmark in the theme's text colour (works on light and dark)
const Logo = ({ size = "md", className = "" }) => {
  const big = size === "lg";
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img src={assets.logo_icon} alt="" className={big ? "w-14 h-14" : "w-8 h-8"} />
      <span className={`font-semibold tracking-tight text-fg ${big ? "text-4xl" : "text-lg"}`}>QuickChat</span>
    </div>
  );
};

export default Logo;
