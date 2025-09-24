"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import logo from "../../public/assets/index_hyundai.svg";
import loader from "../../public/assets/t3-loader.gif";
// import { Home01Icon, Layers01Icon, Logout04Icon } from "hugeicons-react";
import {
  Car,
  CarFront,
  ClipboardList,
  Download,
  HistoryIcon,
  House,
  Layers3,
  LogOut,
  Menu,
  PlusIcon,
  UmbrellaIcon,
  UserRoundCog,
} from "lucide-react";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

import { useRouter } from "next/navigation";
import { logoutUser } from "@/lib/appwrite";
import { deleteCookie } from "cookies-next";
import { Button } from "./ui/button";

export default function Sidebar({ home }: any) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const router = useRouter();

  console.log("THIS IS THE HOME - ", home);

  const logout = async () => {
    setIsLoggingOut((prev) => true);
    await logoutUser();
    deleteCookie("user");
    router.push("/");
    // setIsLoggingOut((prev) => false);
  };

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <>
      <div className="sm:flex lg:hidden z-10 absolute top-5 right-5">
        <Drawer>
          <DrawerTrigger>
            <Menu color="#EF4444" size={38} />
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle className="flex justify-center">
                <Image src={logo} width={100} height={50} alt="Logo" />
              </DrawerTitle>
            </DrawerHeader>
            <DrawerFooter>
              <DrawerClose>
                <Button
                  className="flex justify-between p-4 border-b w-full"
                  onClick={() => router.push(home)}
                  variant={"link"}
                >
                  <House />
                  <div>Home</div>
                </Button>
              </DrawerClose>
              {(home == "/parts" || home == "/biller") && (
                <DrawerClose>
                  <Button
                    className="flex justify-between p-4 border-b w-full"
                    onClick={() => router.push(`${home}/parts-inventory`)}
                    variant={"link"}
                  >
                    <ClipboardList />
                    <div>Parts Inventory</div>
                  </Button>
                </DrawerClose>
              )}
              {home == "/parts" && (
                <DrawerClose>
                  <Button
                    className="flex justify-between p-4 border-b w-full"
                    onClick={() => router.push(`${home}/addParts`)}
                    variant={"link"}
                  >
                    <PlusIcon />
                    <div>Add Parts</div>
                  </Button>
                </DrawerClose>
              )}

              {home == "/admin" && (
                <DrawerClose>
                  <Button
                    className="flex justify-between p-4 border-b w-full"
                    onClick={() => router.push(`${home}/reports`)}
                    variant={"link"}
                  >
                    <Download />
                    <div>Reports</div>
                  </Button>
                  <Button
                    className="flex justify-between p-4 border-b w-full"
                    onClick={() => router.push(`${home}/add-car`)}
                    variant={"link"}
                  >
                    <CarFront />
                    <div>Add Car Model</div>
                  </Button>
                </DrawerClose>
              )}

              {home == "/security" && (
                <DrawerClose>
                  <Button
                    className="flex justify-between p-4 border-b w-full"
                    onClick={() => router.push(`${home}/addCar`)}
                    variant={"link"}
                  >
                    <Car />
                    <div>Add Car</div>
                  </Button>
                </DrawerClose>
              )}
              <Button
                onClick={logout}
                className="flex justify-between p-4 border-b"
                variant={"link"}
              >
                {isLoggingOut ? (
                  <Image src={loader} width={50} height={50} alt="Logo" />
                ) : (
                  <>
                    <LogOut />
                    <div>Logout</div>
                  </>
                )}
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
      <div className="hidden lg:flex sticky top-0 shadow-xl p-6 flex-col h-dvh bg-gray-50 min-w-[80px] items-center py-8">
        <div className="mb-10">
          <Image src={logo} width={50} height={50} alt="Logo" />
        </div>
        <div className="flex flex-col h-full justify-between">
          <div className="flex flex-col space-y-5">
            <HoverCard>
              <HoverCardTrigger asChild>
                <div
                  className="border-2 rounded-md shadow-md p-3 cursor-pointer"
                  onClick={() => handleNavigation(home)}
                >
                  <House />
                </div>
              </HoverCardTrigger>
              <HoverCardContent className="ml-10 -mt-5 font-semibold w-fit">
                Home
              </HoverCardContent>
            </HoverCard>

            {(home == "/parts" || home == "/biller") && (
              <HoverCard>
                <HoverCardTrigger asChild>
                  <div
                    className="border-2 rounded-md shadow-md p-3 cursor-pointer"
                    onClick={() => handleNavigation(`${home}/parts-inventory`)}
                  >
                    <ClipboardList />
                  </div>
                </HoverCardTrigger>
                <HoverCardContent className="ml-10 -mt-5 font-semibold w-fit">
                  Parts Inventory
                </HoverCardContent>
              </HoverCard>
            )}

            {home == "/admin" && (
              <>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <div
                      className="border-2 rounded-md shadow-md p-3 cursor-pointer"
                      onClick={() => handleNavigation(`${home}/reports`)}
                    >
                      <Download />
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent className="ml-10 -mt-5 font-semibold w-fit">
                    Download Reports
                  </HoverCardContent>
                </HoverCard>
              </>
            )}

            {home == "/security" && (
              <HoverCard>
                <HoverCardTrigger asChild>
                  <div
                    className="border-2 rounded-md shadow-md p-3 cursor-pointer"
                    onClick={() => handleNavigation(`${home}/addCar`)}
                  >
                    <Car />
                  </div>
                </HoverCardTrigger>
                <HoverCardContent className="ml-10 -mt-5 font-semibold w-fit">
                  Add Car
                </HoverCardContent>
              </HoverCard>
            )}
            {home == "/parts" && (
              <HoverCard>
                <HoverCardTrigger asChild>
                  <div
                    className="border-2 rounded-md shadow-md p-3 cursor-pointer"
                    onClick={() => handleNavigation(`${home}/addParts`)}
                  >
                    <PlusIcon />
                  </div>
                </HoverCardTrigger>
                <HoverCardContent className="ml-10 -mt-5 font-semibold w-fit">
                  Add Parts
                </HoverCardContent>
              </HoverCard>
            )}
          </div>
          <div>
            <button
              onClick={logout}
              className={`border-2 rounded-md shadow-md ${
                isLoggingOut ? "opacity-50 p-1" : "p-3"
              }`}
            >
              {isLoggingOut ? (
                <Image src={loader} width={50} height={50} alt="Logo" />
              ) : (
                <LogOut />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
