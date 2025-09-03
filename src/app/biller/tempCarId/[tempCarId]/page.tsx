"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { getCookie } from "cookies-next";
import { usePathname } from "next/navigation";
import { toast } from "sonner";

import {
  getTempCarById,
  getCarById,
  updateCarField,
  updateTempCarById,
  updateTempCarFieldsById,
  CarStatus, // 0 ENTERED, 1 IN_PROGRESS, 2 DONE, 3 GATEPASS_GENERATED, 4 EXITED
} from "@/lib/appwrite";

import { purposeOfVisits } from "@/lib/helper";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import loader from "../../../../../public/assets/t3-loader.gif";

const useDev = false;
let apiUrl: string;
if (useDev) {
  apiUrl = "http://localhost:3000";
} else {
  apiUrl = "https://hyundai-garage-frontend.vercel.app";
}

type TempCarDoc = any;
type CarDoc = any;

export default function TempCarPage({
  params,
}: {
  params: { tempCarId: string };
}) {
  const pathname = usePathname();

  // user
  const [name, setName] = useState<string>("");

  // docs
  const [tempCar, setTempCar] = useState<TempCarDoc | null>(null);
  const [car, setCar] = useState<CarDoc | null>(null);

  // Cars table fields (editable)
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [customerAddress, setCustomerAddress] = useState<string>("");

  // Field errors
  const [errName, setErrName] = useState<string>("");
  const [errPhone, setErrPhone] = useState<string>("");
  const [errEmail, setErrEmail] = useState<string>("");
  const [errAddress, setErrAddress] = useState<string>("");

  // ui
  const [loading, setLoading] = useState<boolean>(true);
  const [busy, setBusy] = useState<boolean>(false);
  const [status, setStatus] = useState<CarStatus>(CarStatus.ENTERED);

  // ---------- validation helpers ----------
  const validateName = (v: string) => {
    const val = v.trim();
    if (!val) return "Name is required";
    if (val.length < 2) return "Name must be at least 2 characters";
    return "";
  };

  const validatePhone = (v: string) => {
    const digits = v.replace(/\D+/g, "");
    if (!digits) return "Phone is required";
    if (digits.length !== 10) return "Phone must be 10 digits";
    return "";
  };

  const validateEmail = (v: string) => {
    const val = v.trim();
    if (!val) return ""; // optional
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    return ok ? "" : "Enter a valid email";
  };

  const validateAddress = (v: string) => {
    const val = v.trim();
    if (!val) return ""; // optional
    if (val.length < 5) return "Address must be at least 5 characters";
    return "";
  };

  // initial load
  useEffect(() => {
    const load = async () => {
      try {
        const token = getCookie("user");
        if (token) {
          try {
            const parsed = JSON.parse(String(token));
            setName(parsed?.name ?? "");
          } catch {
            // ignore cookie parse issues
          }
        }

        const t: any = await getTempCarById(params.tempCarId);
        if (!t) {
          toast.error("Temp car not found");
          setLoading(false);
          return;
        }
        setTempCar(t);
        setStatus(t.carStatus ?? CarStatus.ENTERED);

        const c: any = await getCarById(t.carsTableId);
        if (!c) {
          toast.error("Car record not found");
          setLoading(false);
          return;
        }
        setCar(c);

        const n = c.customerName || "";
        const p = c.customerPhone || "";
        const e = c.customerEmail || "";
        const a = c.customerAddress || "";

        setCustomerName(n);
        setCustomerPhone(p);
        setCustomerEmail(e);
        setCustomerAddress(a);

        // prime validation states
        setErrName(validateName(n));
        setErrPhone(validatePhone(p));
        setErrEmail(validateEmail(e));
        setErrAddress(validateAddress(a));
      } catch (err) {
        console.error("Load error:", err);
        toast.error("Failed to load car details");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [params.tempCarId]);

  // live-validate on change
  const onNameChange = (v: string) => {
    setCustomerName(v);
    setErrName(validateName(v));
  };
  const onPhoneChange = (v: string) => {
    setCustomerPhone(v);
    setErrPhone(validatePhone(v));
  };
  const onEmailChange = (v: string) => {
    setCustomerEmail(v);
    setErrEmail(validateEmail(v));
  };
  const onAddressChange = (v: string) => {
    setCustomerAddress(v);
    setErrAddress(validateAddress(v));
  };

  const hasErrors = useMemo(
    () => !!(errName || errPhone || errEmail || errAddress),
    [errName, errPhone, errEmail, errAddress]
  );

  const povDescriptions: string[] = useMemo(() => {
    const codeToDesc = new Map<number, string>(
      purposeOfVisits.map((p) => [p.code, p.description])
    );
    const codes: string[] = Array.isArray(tempCar?.purposesOfVisit)
      ? tempCar.purposesOfVisit
      : [];
    return codes
      .map((codeStr) => {
        const n = Number(codeStr);
        return Number.isFinite(n) ? codeToDesc.get(n) ?? null : null;
      })
      .filter((x): x is string => Boolean(x));
  }, [tempCar?.purposesOfVisit]);

  const saveCustomerFields = async () => {
    if (!car) return;

    // final guard
    const eName = validateName(customerName);
    const ePhone = validatePhone(customerPhone);
    const eEmail = validateEmail(customerEmail);
    const eAddress = validateAddress(customerAddress);

    setErrName(eName);
    setErrPhone(ePhone);
    setErrEmail(eEmail);
    setErrAddress(eAddress);

    if (eName || ePhone || eEmail || eAddress) {
      toast.warning("Please fix the highlighted fields");
      return;
    }

    setBusy(true);
    try {
      await updateCarField(car.$id, "customerName", customerName.trim());
      await updateCarField(car.$id, "customerPhone", customerPhone.trim());
      await updateCarField(car.$id, "customerEmail", customerEmail.trim());
      await updateCarField(car.$id, "customerAddress", customerAddress.trim());

      toast.success("Customer details saved");
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to save customer details");
    } finally {
      setBusy(false);
    }
  };

  // progression handlers (no dropdown)
  const markInProgress = async () => {
    if (!tempCar) return;
    try {
      setBusy(true);
      await updateTempCarById(tempCar.$id, CarStatus.IN_PROGRESS);
      setStatus(CarStatus.IN_PROGRESS);
      setTempCar((p: any) => ({ ...p, carStatus: CarStatus.IN_PROGRESS }));
      toast.success("Marked as In Progress");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    } finally {
      setBusy(false);
    }
  };

  const markDone = async () => {
    if (!tempCar) return;
    try {
      setBusy(true);
      await updateTempCarById(tempCar.$id, CarStatus.DONE);
      setStatus(CarStatus.DONE);
      setTempCar((p: any) => ({ ...p, carStatus: CarStatus.DONE }));
      toast.success("Marked as Done");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    } finally {
      setBusy(false);
    }
  };

  const generateGatePass = async () => {
    if (!tempCar || !car) return;
    try {
      setBusy(true);
      const res = await fetch(`${apiUrl}${pathname}/gatePass`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ car, tempCar }),
      });
      if (!res.ok) throw new Error(`Gatepass API failed (${res.status})`);
      const { pdfUrl } = await res.json();

      await updateTempCarFieldsById(tempCar.$id, {
        gatePassPDF: pdfUrl,
        carStatus: CarStatus.GATEPASS_GENERATED,
      });

      setTempCar((prev: any) => ({
        ...prev,
        gatePassPDF: pdfUrl,
        carStatus: CarStatus.GATEPASS_GENERATED,
      }));
      setStatus(CarStatus.GATEPASS_GENERATED);

      if (pdfUrl) window.open(pdfUrl, "_blank");
      toast.success("Gate Pass generated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate Gate Pass");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Image src={loader} width={100} height={100} alt="Loading" />
      </div>
    );
  }

  // Top bar buttons change by status (no dropdown)
  const renderProgressButtons = () => {
    switch (status) {
      case CarStatus.ENTERED:
        return (
          <Button
            variant="outline"
            className="px-8 py-2 bg-red-500 text-white hover:bg-red-400"
            onClick={markInProgress}
            disabled={busy}
          >
            Start Work
          </Button>
        );
      case CarStatus.IN_PROGRESS:
        return (
          <Button
            variant="outline"
            className="px-8 py-2 bg-red-500 text-white hover:bg-red-400"
            onClick={markDone}
            disabled={busy}
          >
            Mark Done
          </Button>
        );
      case CarStatus.DONE:
        return (
          <Button
            variant="outline"
            className="px-8 py-2 bg-red-500 text-white hover:bg-red-400"
            onClick={generateGatePass}
            disabled={busy}
          >
            Generate Gate Pass
          </Button>
        );
      case CarStatus.GATEPASS_GENERATED:
        return (
          <div className="flex items-center gap-3">
            <span className="px-4 py-2 rounded-md border border-green-600 text-green-700 bg-green-50">
              Gate Pass Generated
            </span>
            {tempCar?.gatePassPDF && (
              <Button
                variant="outline"
                className="px-8 py-2 border border-red-500 text-red-500"
                onClick={() => window.open(tempCar.gatePassPDF, "_blank")}
              >
                Open Gate Pass
              </Button>
            )}
          </div>
        );
      case CarStatus.EXITED:
        return (
          <span className="px-4 py-2 rounded-md border border-gray-400 text-gray-700 bg-gray-50">
            Exited
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col w-[90%] mt-8 space-y-8">
      {/* overlay while saving/generating */}
      {busy && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <Image src={loader} width={100} height={100} alt="Loading" />
        </div>
      )}

      {/* Sticky top bar with progression buttons */}
      <div className="sticky top-5 flex w-full justify-between items-center shadow-md p-4 rounded-lg border border-gray-300 bg-white z-50">
        <div className="text-red-700">
          <Link href="/biller" className="flex items-center gap-3">
            <ArrowLeft />
            <span>Back to Cars</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">{renderProgressButtons()}</div>
      </div>

      {/* Header: basic info */}
      <div>
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-3xl">{tempCar?.carNumber}</span>
          <span className="font-medium text-2xl text-gray-700">
            {car ? `(${car.carMake} ${car.carModel})` : ""}
          </span>
        </div>
        {povDescriptions.length > 0 && (
          <div className="mt-1 text-sm text-gray-600">
            Purpose(s): {povDescriptions.join(", ")}
          </div>
        )}
      </div>

      {/* Customer Details (edit) + Vehicle details (read-only) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer */}
        <div className="border rounded-lg p-4">
          <div className="font-semibold text-xl mb-3">Customer Details</div>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-600 mb-1">Name</div>
              <Input
                value={customerName}
                onChange={(e) => onNameChange(e.target.value)}
                aria-invalid={!!errName}
              />
              {errName && (
                <p className="text-xs text-red-600 mt-1">{errName}</p>
              )}
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Phone</div>
              <Input
                value={customerPhone}
                onChange={(e) => onPhoneChange(e.target.value)}
                inputMode="tel"
                aria-invalid={!!errPhone}
              />
              {errPhone && (
                <p className="text-xs text-red-600 mt-1">{errPhone}</p>
              )}
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Email</div>
              <Input
                value={customerEmail}
                onChange={(e) => onEmailChange(e.target.value)}
                type="email"
                aria-invalid={!!errEmail}
              />
              {errEmail && (
                <p className="text-xs text-red-600 mt-1">{errEmail}</p>
              )}
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Address</div>
              <Input
                value={customerAddress}
                onChange={(e) => onAddressChange(e.target.value)}
                aria-invalid={!!errAddress}
              />
              {errAddress && (
                <p className="text-xs text-red-600 mt-1">{errAddress}</p>
              )}
            </div>

            <div className="pt-2">
              <Button
                variant="outline"
                className="px-8 py-2 bg-red-500 text-white hover:bg-red-400"
                onClick={saveCustomerFields}
                disabled={busy || hasErrors}
              >
                Save Customer Details
              </Button>
            </div>
          </div>
        </div>

        {/* Vehicle */}
        <div className="border rounded-lg p-4">
          <div className="font-semibold text-xl mb-3">Vehicle Details</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Registration</span>
              <span className="font-medium">{tempCar?.carNumber || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Make</span>
              <span className="font-medium">{car?.carMake || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Model</span>
              <span className="font-medium">{car?.carModel || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status</span>
              <span className="font-medium">
                {status === CarStatus.ENTERED
                  ? "Entered"
                  : status === CarStatus.IN_PROGRESS
                  ? "In Progress"
                  : status === CarStatus.DONE
                  ? "Done"
                  : status === CarStatus.GATEPASS_GENERATED
                  ? "Gatepass Generated"
                  : status === CarStatus.EXITED
                  ? "Exited"
                  : "Unknown"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Downloads — Gate Pass only */}
      {/* <div className="border rounded-lg p-4">
        <div className="font-semibold text-xl mb-3">Downloads</div>
        {tempCar?.gatePassPDF ? (
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="px-8 py-2 border border-red-500 text-red-500"
              onClick={() => window.open(tempCar.gatePassPDF, "_blank")}
            >
              Gate Pass
            </Button>
          </div>
        ) : (
          <div className="text-sm text-gray-600">No Gate Pass yet.</div>
        )}
      </div> */}
    </div>
  );
}
