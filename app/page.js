"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Loading from "./components/Loading";
import SoundBoard from "./components/soundBoard";
import AddSound from "./components/AddSound";
import Image from 'next/image'
import { CiLogout } from "react-icons/ci";
import { CiCircleInfo } from "react-icons/ci";

export default function HomePage() {
  var router = useRouter();
  var [authenticated, setAuthenticated] = useState(null);
  var [isAdmin, setIsAdmin] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("isAdmin");
    window.location.reload(); // Refresh the page or navigate to login
};
  
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
    <div className="min-h-screen gap-1 bg-base-200 flex flex-col items-center">
      <div className=" w-[97%] rounded-lg bg-base-100 text-center py-1 flex my-3  justify-between items-center px-5 z-10 shadow-lg ">
        
        <div className="flex justify-center items-center">
        <Image
      src="/logo.svg"
      width={25}
      height={25}
      alt="logo"
    />       
        <p className="items-center text-secondary font-bold text-lg">Open <span className=" -ml-2 text-accent">Howl</span></p>
  
<div></div>
     </div>
  
     <div className="flex items-center gap-1">
      
     <CiCircleInfo size={25} className=" cursor-pointer text-accent font-bold flex items-center hover:text-secondary active:text-secondary ease-in-out duration-75 " onClick={()=>document.getElementById('my_modal_2').showModal()} />
     <dialog id="my_modal_2" className="modal">
  <div className="modal-box">
    <h3 className="font-bold text-lg">OpenHowl</h3>
    <p className="py-4">  asdasd asd asdasd asd asd asdasdasd asdasdsdfghjkdsfgjkhgdsfahjkgfjk kfgdskjfgsdkhjfgdsh kjsdfgkhj fdh kgjs kjfdgsjkh fdgjkh sdfghjkdkfjgh fkgh sdjdfkh jsgh jkfgdh kjfsgdkhj kjh sdgfkjh dsfgkjh</p>
  </div>
  <form method="dialog" className="modal-backdrop">
    <button>close</button>
  </form>
</dialog>
<div className=" cursor-pointer text-accent font-bold flex items-center hover:text-secondary active:text-secondary ease-in-out duration-75">
   <CiLogout  onClick={handleLogout} size={25} />
   </div></div>
        

      </div>

      <div className="w-full max-w-4xl">
      <SoundBoard isAdmin={isAdmin} />
            </div>      
    </div>
  );
}
