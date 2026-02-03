import React from "react";
import loadingGif from "../../assets/loader.gif";

const LoadingIcon: React.FC<{className?: string}> = ({className}) => (
  <div className={className || "flex justify-center items-center py-8"}>
    <img src={loadingGif} alt="Loading..." style={{width: 60, height: 60}} />
  </div>
);

export default LoadingIcon;
