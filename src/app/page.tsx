"use client";

import Link from "next/link";
import { useState } from "react";
import Navbar from "./Navbar";

export default function RootPage() {
  const [currentBGImage, setCurrentBGImage] =
    useState<string>("HotTearsMakeup.jpg");
  return (
    <>
      <Navbar />
      <div
        className={`h-screen w-screen scroll-y-disabled text-white bg-cover bg-fixed bg-center bg-no-repeat page-fade-in transition-all ease-in-out duration-700`}
        style={{ backgroundImage: `url('${currentBGImage}')` }}
      >
        <div className="h-full flex justify-center">
          <div
            className={`flex flex-col justify-evenly pt-[15vh] pb-[10vh] text-center px-8`}
            onMouseLeave={() => setCurrentBGImage("HotTearsMakeup.jpg")}
          >
            <div>
              <Link
                href={"/film/Grins"}
                onMouseOver={() => setCurrentBGImage("Mike_and_abby.jpg")}
                className="text-6xl transition-all duration-500 ease-in-out hover:tracking-wider"
              >
                GRINS
              </Link>
            </div>
            <div>
              <Link
                href={"/film/Hot_Tears"}
                onMouseOver={() => setCurrentBGImage("TempHotTears.jpg")}
                className="text-6xl transition-all duration-500 ease-in-out hover:tracking-wider"
              >
                HOT TEARS
              </Link>
            </div>
            <div>
              <Link
                href={"/film/Dirt"}
                onMouseOver={() => setCurrentBGImage("DirtLipstick.jpg")}
                className="text-6xl transition-all duration-500 ease-in-out hover:tracking-wider"
              >
                DIRT
              </Link>
            </div>
            <div>
              <Link
                href={"/film/Craigslist"}
                onMouseOver={() => setCurrentBGImage("Mike_tongue_out.jpg")}
                className="text-6xl transition-all duration-500 ease-in-out hover:tracking-wider"
              >
                CRAIGSLIST
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
