"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Loading from "./components/Loading";
import SoundBoard from "./components/soundBoard";
import AddSound from "./components/AddSound";

export default function HomePage() {
  var router = useRouter();
  var [authenticated, setAuthenticated] = useState(null);
  var [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(function () {
    var token = localStorage.getItem("authToken");
    if (!token) {
      router.replace("/login");
    } else {
      setAuthenticated(true);
      // Only show AddSound for admins.
      setIsAdmin(localStorage.getItem("isAdmin") === "true");
    }
  }, []);
  
  if (authenticated === null) {
    return <Loading />;
  }
  
  return (
    <div className="min-h-screen bg-base-200 flex flex-col items-center">
      <div className="w-full max-w-4xl py-3 px-4 text-center">
        <p className="text-content text-md">Click to play • Hold to edit</p>
        {isAdmin && (
          <div className="mt-4">
            <AddSound />
          </div>
        )}
      </div>
      
      <div className="w-full max-w-4xl">
        <SoundBoard />
      </div>
    </div>
  );
}
