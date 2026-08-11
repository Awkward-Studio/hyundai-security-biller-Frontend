"use client";

import React from "react";
import Image from "next/image";
import loader from "../../public/assets/t3-loader.gif";

type Props = {};

function PrimaryButton({ title, handleButtonPress, isLoading, className = "", disabled = false }: any) {
  return (
    <button
      disabled={disabled || isLoading}
      className={`bg-blue-600 rounded-xl h-14 flex flex-row justify-center items-center w-1/4 text-white font-bold ${
        isLoading ? "opacity-50" : ""
      } ${className}`}
      onClick={handleButtonPress}
    >
      {title}
      {isLoading && <Image src={loader} width={50} height={50} alt="Logo" />}
    </button>
  );
}

export default PrimaryButton;
