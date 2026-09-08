"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import logo from "../../public/assets/index_hyundai.svg";
import loader from "../../public/assets/t3-loader.gif";
import {
  ArrowLeftRight,
  BadgePercent,
  Car,
  CarFront,
  Clock,
  Download,
  FileSpreadsheet,
  House,
  LogOut,
  MapPin,
  Menu,
  Receipt,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
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
import { logoutUser } from "@/lib/api";
import { deleteCookie, getCookie } from "cookies-next";
import { Button } from "./ui/button";

export default function Sidebar({ home }: any) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    try {
      const token = getCookie("user");
      if (token) {
        const parsed = JSON.parse(String(token));
        const labels = Array.isArray(parsed?.labels) ? parsed.labels : [];
        if (typeof labels[0] === "string") {
          setUserRole(labels[0]);
        }
        if (Array.isArray(parsed?.permissions)) {
          setPermissions(parsed.permissions);
        }
      }
    } catch {}
  }, []);


  const logout = async () => {
    setIsLoggingOut(true);
    await logoutUser();
    deleteCookie("user");
    router.push("/");
  };

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const effectiveRole = userRole || (home === "/admin" || home?.startsWith("/admin") ? "admin" : home === "/biller" ? "biller" : home === "/security" ? "security" : null);
  const activeHome = effectiveRole ? `/${effectiveRole}` : home || "/";
  const isAdmin = effectiveRole === "admin";

  const hasPerm = (key: string) => {
    if (isAdmin) return true;
    if (!permissions || permissions.length === 0) return true;
    return permissions.includes(key);
  };

  return (
    <>
      <div className="sm:flex lg:hidden z-10 absolute top-5 right-5">
        <Drawer>
          <DrawerTrigger>
            <Menu color="#EF4444" size={38} />
          </DrawerTrigger>
          <DrawerContent className="max-h-[90vh] overflow-y-auto">
            <DrawerHeader>
              <DrawerTitle className="flex justify-center">
                <Image src={logo} width={100} height={50} alt="Logo" />
              </DrawerTitle>
            </DrawerHeader>
            <DrawerFooter>
              <DrawerClose>
                <Button
                  className="flex justify-between p-4 border-b w-full"
                  onClick={() => router.push(activeHome)}
                  variant={"link"}
                >
                  <House />
                  <div>Home / Dashboard</div>
                </Button>
              </DrawerClose>

              {hasPerm("logs.view") && (
                <DrawerClose>
                  <Button
                    className="flex justify-between p-4 border-b w-full"
                    onClick={() => router.push(`/vehicle-logs`)}
                    variant={"link"}
                  >
                    <FileSpreadsheet />
                    <div>Vehicle Logs</div>
                  </Button>
                </DrawerClose>
              )}

              {hasPerm("cashier.approve") && (
                <DrawerClose>
                  <Button
                    className="flex justify-between p-4 border-b w-full"
                    onClick={() => router.push(`/cashier`)}
                    variant={"link"}
                  >
                    <Receipt />
                    <div>Cashier Clearance</div>
                  </Button>
                </DrawerClose>
              )}

              {hasPerm("servicetype.edit") && (
                <DrawerClose>
                  <Button
                    className="flex justify-between p-4 border-b w-full"
                    onClick={() => router.push(`/admin/modify-service`)}
                    variant={"link"}
                  >
                    <SlidersHorizontal />
                    <div>Modify Service Type</div>
                  </Button>
                </DrawerClose>
              )}

              {hasPerm("transfer.create") && (
                <DrawerClose>
                  <Button
                    className="flex justify-between p-4 border-b w-full"
                    onClick={() => router.push(`/transfer`)}
                    variant={"link"}
                  >
                    <ArrowLeftRight />
                    <div>Vehicle Transfer</div>
                  </Button>
                </DrawerClose>
              )}

              {hasPerm("reports.view") && (
                <DrawerClose>
                  <Button
                    className="flex justify-between p-4 border-b w-full"
                    onClick={() => router.push(`/admin/reports`)}
                    variant={"link"}
                  >
                    <Download />
                    <div>Reports</div>
                  </Button>
                </DrawerClose>
              )}

              {hasPerm("locations.manage") && (
                <DrawerClose>
                  <Button
                    className="flex justify-between p-4 border-b w-full"
                    onClick={() => router.push(`/admin/locations`)}
                    variant={"link"}
                  >
                    <MapPin />
                    <div>Location Master</div>
                  </Button>
                </DrawerClose>
              )}

              {hasPerm("drivers.manage") && (
                <DrawerClose>
                  <Button
                    className="flex justify-between p-4 border-b w-full"
                    onClick={() => router.push(`/admin/drivers`)}
                    variant={"link"}
                  >
                    <UserCheck />
                    <div>Driver Master</div>
                  </Button>
                </DrawerClose>
              )}

              {hasPerm("services.manage") && (
                <DrawerClose>
                  <Button
                    className="flex justify-between p-4 border-b w-full"
                    onClick={() => router.push(`/admin/service-types`)}
                    variant={"link"}
                  >
                    <BadgePercent />
                    <div>Service Type Master</div>
                  </Button>
                </DrawerClose>
              )}

              {hasPerm("roles.manage") && (
                <DrawerClose>
                  <Button
                    className="flex justify-between p-4 border-b w-full"
                    onClick={() => router.push(`/admin/roles`)}
                    variant={"link"}
                  >
                    <ShieldCheck />
                    <div>Role Master</div>
                  </Button>
                </DrawerClose>
              )}

              {hasPerm("users.manage") && (
                <DrawerClose>
                  <Button
                    className="flex justify-between p-4 border-b w-full"
                    onClick={() => router.push(`/admin/userManagement`)}
                    variant={"link"}
                  >
                    <Users />
                    <div>User Management</div>
                  </Button>
                </DrawerClose>
              )}

              {hasPerm("retention.manage") && (
                <DrawerClose>
                  <Button
                    className="flex justify-between p-4 border-b w-full"
                    onClick={() => router.push(`/admin/retention`)}
                    variant={"link"}
                  >
                    <Clock />
                    <div>Log Retention</div>
                  </Button>
                </DrawerClose>
              )}

              {hasPerm("models.manage") && (
                <DrawerClose>
                  <Button
                    className="flex justify-between p-4 border-b w-full"
                    onClick={() => router.push(`/admin/add-car`)}
                    variant={"link"}
                  >
                    <CarFront />
                    <div>Car Makes &amp; Models</div>
                  </Button>
                </DrawerClose>
              )}

              {hasPerm("settings.manage") && (
                <DrawerClose>
                  <Button
                    className="flex justify-between p-4 border-b w-full"
                    onClick={() => router.push(`/admin/settings`)}
                    variant={"link"}
                  >
                    <Settings />
                    <div>App Settings</div>
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

      <div className="hidden lg:flex sticky top-0 shadow-xl p-4 flex-col h-dvh bg-gray-50 min-w-[80px] items-center py-6 overflow-y-auto">
        <div className="mb-6">
          <Image src={logo} width={50} height={50} alt="Logo" />
        </div>
        <div className="flex flex-col h-full justify-between w-full items-center">
          <div className="flex flex-col space-y-4 items-center">
            {/* Home / Dashboard */}
            <HoverCard>
              <HoverCardTrigger asChild>
                <div
                  className="border-2 rounded-md shadow-md p-3 cursor-pointer hover:bg-slate-100"
                  onClick={() => handleNavigation(activeHome)}
                >
                  <House size={20} />
                </div>
              </HoverCardTrigger>
              <HoverCardContent className="ml-10 -mt-5 font-semibold w-fit z-50">
                Home / Dashboard
              </HoverCardContent>
            </HoverCard>

            {/* Vehicle Logs */}
            {hasPerm("logs.view") && (
              <HoverCard>
                <HoverCardTrigger asChild>
                  <div
                    className="border-2 rounded-md shadow-md p-3 cursor-pointer hover:bg-slate-100"
                    onClick={() => handleNavigation("/vehicle-logs")}
                  >
                    <FileSpreadsheet size={20} />
                  </div>
                </HoverCardTrigger>
                <HoverCardContent className="ml-10 -mt-5 font-semibold w-fit z-50">
                  Vehicle Logs
                </HoverCardContent>
              </HoverCard>
            )}

            {/* Cashier Clearance */}
            {hasPerm("cashier.approve") && (
              <HoverCard>
                <HoverCardTrigger asChild>
                  <div
                    className="border-2 rounded-md shadow-md p-3 cursor-pointer hover:bg-slate-100"
                    onClick={() => handleNavigation("/cashier")}
                  >
                    <Receipt size={20} />
                  </div>
                </HoverCardTrigger>
                <HoverCardContent className="ml-10 -mt-5 font-semibold w-fit z-50">
                  Cashier Clearance
                </HoverCardContent>
              </HoverCard>
            )}

            {/* Modify Service Type */}
            {hasPerm("servicetype.edit") && (
              <HoverCard>
                <HoverCardTrigger asChild>
                  <div
                    className="border-2 rounded-md shadow-md p-3 cursor-pointer hover:bg-slate-100"
                    onClick={() => handleNavigation("/admin/modify-service")}
                  >
                    <SlidersHorizontal size={20} />
                  </div>
                </HoverCardTrigger>
                <HoverCardContent className="ml-10 -mt-5 font-semibold w-fit z-50">
                  Modify Service Type
                </HoverCardContent>
              </HoverCard>
            )}

            {/* Vehicle Transfer */}
            {hasPerm("transfer.create") && (
              <HoverCard>
                <HoverCardTrigger asChild>
                  <div
                    className="border-2 rounded-md shadow-md p-3 cursor-pointer hover:bg-slate-100"
                    onClick={() => handleNavigation("/transfer")}
                  >
                    <ArrowLeftRight size={20} />
                  </div>
                </HoverCardTrigger>
                <HoverCardContent className="ml-10 -mt-5 font-semibold w-fit z-50">
                  Vehicle Transfer
                </HoverCardContent>
              </HoverCard>
            )}

            {/* Reports */}
            {hasPerm("reports.view") && (
              <HoverCard>
                <HoverCardTrigger asChild>
                  <div
                    className="border-2 rounded-md shadow-md p-3 cursor-pointer hover:bg-slate-100"
                    onClick={() => handleNavigation("/admin/reports")}
                  >
                    <Download size={20} />
                  </div>
                </HoverCardTrigger>
                <HoverCardContent className="ml-10 -mt-5 font-semibold w-fit z-50">
                  Reports
                </HoverCardContent>
              </HoverCard>
            )}

            {/* Location Master */}
            {hasPerm("locations.manage") && (
              <HoverCard>
                <HoverCardTrigger asChild>
                  <div
                    className="border-2 rounded-md shadow-md p-3 cursor-pointer hover:bg-slate-100"
                    onClick={() => handleNavigation("/admin/locations")}
                  >
                    <MapPin size={20} />
                  </div>
                </HoverCardTrigger>
                <HoverCardContent className="ml-10 -mt-5 font-semibold w-fit z-50">
                  Location Master
                </HoverCardContent>
              </HoverCard>
            )}

            {/* Driver Master */}
            {hasPerm("drivers.manage") && (
              <HoverCard>
                <HoverCardTrigger asChild>
                  <div
                    className="border-2 rounded-md shadow-md p-3 cursor-pointer hover:bg-slate-100"
                    onClick={() => handleNavigation("/admin/drivers")}
                  >
                    <UserCheck size={20} />
                  </div>
                </HoverCardTrigger>
                <HoverCardContent className="ml-10 -mt-5 font-semibold w-fit z-50">
                  Driver Master
                </HoverCardContent>
              </HoverCard>
            )}

            {/* Service Type Master */}
            {hasPerm("services.manage") && (
              <HoverCard>
                <HoverCardTrigger asChild>
                  <div
                    className="border-2 rounded-md shadow-md p-3 cursor-pointer hover:bg-slate-100"
                    onClick={() => handleNavigation("/admin/service-types")}
                  >
                    <BadgePercent size={20} />
                  </div>
                </HoverCardTrigger>
                <HoverCardContent className="ml-10 -mt-5 font-semibold w-fit z-50">
                  Service Type Master
                </HoverCardContent>
              </HoverCard>
            )}

            {/* Role Master */}
            {hasPerm("roles.manage") && (
              <HoverCard>
                <HoverCardTrigger asChild>
                  <div
                    className="border-2 rounded-md shadow-md p-3 cursor-pointer hover:bg-slate-100"
                    onClick={() => handleNavigation("/admin/roles")}
                  >
                    <ShieldCheck size={20} />
                  </div>
                </HoverCardTrigger>
                <HoverCardContent className="ml-10 -mt-5 font-semibold w-fit z-50">
                  Role Master
                </HoverCardContent>
              </HoverCard>
            )}

            {/* User Management */}
            {hasPerm("users.manage") && (
              <HoverCard>
                <HoverCardTrigger asChild>
                  <div
                    className="border-2 rounded-md shadow-md p-3 cursor-pointer hover:bg-slate-100"
                    onClick={() => handleNavigation("/admin/userManagement")}
                  >
                    <Users size={20} />
                  </div>
                </HoverCardTrigger>
                <HoverCardContent className="ml-10 -mt-5 font-semibold w-fit z-50">
                  User Management
                </HoverCardContent>
              </HoverCard>
            )}

            {/* Log Retention */}
            {hasPerm("retention.manage") && (
              <HoverCard>
                <HoverCardTrigger asChild>
                  <div
                    className="border-2 rounded-md shadow-md p-3 cursor-pointer hover:bg-slate-100"
                    onClick={() => handleNavigation("/admin/retention")}
                  >
                    <Clock size={20} />
                  </div>
                </HoverCardTrigger>
                <HoverCardContent className="ml-10 -mt-5 font-semibold w-fit z-50">
                  Log Retention
                </HoverCardContent>
              </HoverCard>
            )}

            {/* Car Makes & Models */}
            {hasPerm("models.manage") && (
              <HoverCard>
                <HoverCardTrigger asChild>
                  <div
                    className="border-2 rounded-md shadow-md p-3 cursor-pointer hover:bg-slate-100"
                    onClick={() => handleNavigation("/admin/add-car")}
                  >
                    <CarFront size={20} />
                  </div>
                </HoverCardTrigger>
                <HoverCardContent className="ml-10 -mt-5 font-semibold w-fit z-50">
                  Car Makes &amp; Models
                </HoverCardContent>
              </HoverCard>
            )}

            {/* App Settings */}
            {hasPerm("settings.manage") && (
              <HoverCard>
                <HoverCardTrigger asChild>
                  <div
                    className="border-2 rounded-md shadow-md p-3 cursor-pointer hover:bg-slate-100"
                    onClick={() => handleNavigation("/admin/settings")}
                  >
                    <Settings size={20} />
                  </div>
                </HoverCardTrigger>
                <HoverCardContent className="ml-10 -mt-5 font-semibold w-fit z-50">
                  App Settings
                </HoverCardContent>
              </HoverCard>
            )}
          </div>


          <div className="mt-4">
            <button
              onClick={logout}
              className={`border-2 rounded-md shadow-md hover:bg-red-50 ${
                isLoggingOut ? "opacity-50 p-1" : "p-3"
              }`}
            >
              {isLoggingOut ? (
                <Image src={loader} width={40} height={40} alt="Logo" />
              ) : (
                <LogOut size={20} />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

