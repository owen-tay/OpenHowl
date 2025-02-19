"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Loading from "./components/Loading";
import SoundBoard from "./components/soundBoard";
import AddSound from "./components/AddSound";
import Image from "next/image";
import { CiLogout, CiCircleInfo } from "react-icons/ci";

export default function HomePage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("isAdmin");
    window.location.reload();
  };

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.replace("/login");
    } else {
      setAuthenticated(true);
      setIsAdmin(localStorage.getItem("isAdmin") === "true");
    }
  }, []);

  if (authenticated === null) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen gap-1 bg-base-200 flex flex-col items-center">
      <div className="w-[97%] rounded-lg bg-base-100 text-center py-1 flex my-3 justify-between items-center px-5 z-10 shadow-lg">
        <div className="flex justify-center items-center">
                   
          <p className="items-center text-secondary font-bold text-lg">
            Open <span className="-ml-2 text-accent">Howl</span>
          </p>
        </div>

        <div className="flex items-center gap-1">
          <CiCircleInfo
            size={25}
            className="cursor-pointer text-accent font-bold flex items-center hover:text-secondary active:text-secondary ease-in-out duration-75"
            onClick={() => document.getElementById("info_modal").showModal()}
          />
          <dialog id="info_modal" className="modal">
            <div className="modal-box">
              <div className="flex justify-center flex-col text-sm items-center">
                <Image
                  src="/logo.svg"
                  width={35}
                  height={35}
                  alt="logo"
                  className="-mb-3 animate-bounce"
                />
                <p className="text-secondary font-bold text-lg">
                  Open <span className="-ml-2 text-accent">Howl</span>
                </p>
              </div>
              <h2 className="mt-2">
                  OpenHowl is free to be used or
                  modified.{" "}
                  <a
                    href="https://github.com/owen-tay/OpenHowl"
                    target="_blank"
                    className="text-accent underline"
                  >
                    GitHub Link
                  </a>
                  .
                </h2>
              <div className="text-xs mt-4">
                <p>
                  OpenHowl is an open-source, self-hosted Discord soundboard
                  designed for personal and community use.
                </p>
                <ul className="list-disc list-inside mt-2">
                  <li>
                    No Guarantees: OpenHowl is provided "as is" without any
                    warranties or guarantees. Use at your own risk.
                  </li>
                  <li>
                    Self-Hosting Responsibility: You are responsible for
                    setting up, securing, and maintaining your own
                    installation.
                  </li>
                  <li>
                    Compliance: Ensure compliance with{" "}
                    <a
                      href="https://discord.com/terms"
                      target="_blank"
                      className="text-accent underline"
                    >
                      Discord’s Terms of Service
                    </a>{" "}
                    and copyright laws when using OpenHowl for streaming,
                    downloading, or modifying audio.
                  </li>
                  <li>
                    Third-Party Dependencies: OpenHowl relies on open-source
                    libraries such as yt-dlp, discord.py, and pydub. The
                    maintainers are not responsible for any issues caused by
                    these dependencies.
                  </li>
                  <li>
                    Security Risks: Installing and running OpenHowl may require
                    network configuration, port forwarding, and running scripts.
                    Do not install it if you do not understand the risks.
                  </li>
                </ul>
                <p className="mt-2">
                  By using OpenHowl, you acknowledge that the maintainers are
                  not liable for any misuse, legal issues, or damages arising
                  from the software.
                </p>



                <h3 className="mt-3 text-md font-semibold">MIT License</h3>
                <p className="p-1 rounded text-xs">
MIT License

Copyright (c) 2025 OpenHowl

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.



THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
                </p>
              </div>
            </div>
            <form method="dialog" className="modal-backdrop">
              <button>Close</button>
            </form>
          </dialog>

          <div className="cursor-pointer text-accent font-bold flex items-center hover:text-secondary active:text-secondary ease-in-out duration-75">
            <CiLogout onClick={handleLogout} size={25} />
          </div>
        </div>
      </div>

      <div className="w-full max-w-4xl">
        <SoundBoard isAdmin={isAdmin} />
      </div>
    </div>
  );
}
