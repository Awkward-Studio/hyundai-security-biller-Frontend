"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { SearchSelect } from "./SearchSelect";
import loader from "../../public/assets/t3-loader.gif";
import { toast } from "sonner";

import {
  createCarWithTemp,
  fetchCarMakeAndModels,
  getLocations,
  getServiceTypes,
  LocationRecord,
  ServiceTypeRecord,
} from "@/lib/api";
import { carMakeModels, purposeOfVisits } from "@/lib/helper";
import { RadioGroup, RadioGroupItem } from "./ui/radioGroup";
import { Checkbox } from "@/components/ui/checkbox";

type Props = {};

type MakeModels = { company: string; models: string[] };

const indianCarNumberRegex =
  /^(?:[A-Z]{2}\d{2}[A-Z]{0,5}\d{4}|\d{2}BH\d{4}[A-Z]{1,2})$/;

export default function AddCarCards({}: Props) {
  const router = useRouter();

  // form state
  const [carNumber, setCarNumber] = useState("");
  const [isCorrectCarNumber, setIsCorrectCarNumber] = useState(false);

  const [carMake, setCarMake] = useState<string>("");
  const [carModel, setCarModel] = useState<string>("");
  const [serviceType, setServiceType] = useState<string>("");
  const [locationId, setLocationId] = useState<string>("");

  const [handleModelDisable, setHandleModelDisable] = useState(true);

  const [carMakeModels, setCarMakeModels] = useState<MakeModels[]>([]);
  const [selectedCarMakeModels, setSelectedCarMakeModels] = useState<string[]>([]);
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeRecord[]>([]);

  const [includeCode1, setIncludeCode1] = useState<boolean>(false);
  const [selectedRadioCode, setSelectedRadioCode] = useState<string | undefined>(undefined);

  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setIsFetching(true);
      try {
        const [data, locData, stData] = await Promise.all([
          fetchCarMakeAndModels(),
          getLocations().catch(() => ({ documents: [] })),
          getServiceTypes().catch(() => ({ documents: [] })),
        ]);

        const rawData = data as unknown as { documents?: any[] } | any[];
        const documents = Array.isArray((rawData as { documents?: any[] })?.documents)
          ? (rawData as { documents: any[] }).documents
          : Array.isArray(rawData)
          ? rawData
          : [];
        const formatted: MakeModels[] = documents
          .map((doc: any) => ({
            company: String(doc.make ?? ""),
            models: Array.isArray(doc.models) ? doc.models.map(String) : [],
          }))
          .filter((item: MakeModels) => item.company);

        if (!mounted) return;
        setCarMakeModels(formatted.length ? formatted : carMakeModels);
        setSelectedCarMakeModels([]);
        setLocations(locData.documents || []);
        setServiceTypes((stData.documents || []).filter((s) => s.active ?? s.isActive));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error occurred";
        console.error("Failed to fetch data:", err);
        if (mounted) {
          setCarMakeModels(carMakeModels);
          setSelectedCarMakeModels([]);
        }
        toast.error(`Couldn't load car options: ${message}`);
      } finally {
        if (mounted) setIsFetching(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  function checkIndianCarNumber(inputText: string) {
    const v = inputText.toUpperCase().replace(/\s+/g, "");
    setCarNumber(v);
    setIsCorrectCarNumber(indianCarNumberRegex.test(v));
  }

  const handleCarMakeChange = (value: string) => {
    setCarMake(value);
    setCarModel("");
    const found = carMakeModels.find((m) => m.company === value);
    const nextModels = found?.models ?? [];
    setSelectedCarMakeModels(nextModels);
    setHandleModelDisable(nextModels.length === 0);
  };

  const clearPurposes = () => {
    setIncludeCode1(false);
    setSelectedRadioCode(undefined);
  };

  const handleAddCar = async () => {
    if (!isCorrectCarNumber) {
      toast.warning("Enter a valid car number");
      return;
    }
    if (!carMake) {
      toast.warning("Please select car make");
      return;
    }
    if (!carModel) {
      toast.warning("Please select car model");
      return;
    }

    const purposes: string[] = [];
    if (includeCode1) purposes.push("1");
    if (selectedRadioCode) purposes.push(selectedRadioCode);

    if (purposes.length === 0) {
      toast.warning("Please select purpose of visit");
      return;
    }

    setIsButtonLoading(true);
    try {
      const selectedLoc = locations.find((l) => l.id === locationId);
      const payload = {
        carNumber,
        carMake,
        carModel,
        serviceType,
        purposesOfVisit: purposes,
      };

      const created = await createCarWithTemp(payload, selectedLoc?.name, locationId || null);
      if (!created) throw new Error("Create failed");

      toast.success("Vehicle added ✅");
      router.push("/security");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error occurred while adding";
      console.error("Add vehicle error:", e);
      toast.error(`There was an error adding the vehicle: ${message}`);
    } finally {
      setIsButtonLoading(false);
    }
  };

  const isSubmitDisabled =
    isButtonLoading ||
    isFetching ||
    !isCorrectCarNumber ||
    !carMake ||
    !carModel ||
    (!includeCode1 && !selectedRadioCode);

  return (
    <div className="flex flex-col w-full space-y-5">
      {(isButtonLoading || isFetching) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <Image src={loader} width={100} height={100} alt="Loading" />
        </div>
      )}

      <div className="flex w-full flex-col space-y-5">
        <div>
          <label className="block mb-1 text-xs font-semibold text-slate-600 uppercase">Vehicle Number *</label>
          <Input
            id="carNumber"
            placeholder="e.g. MH04AB1234"
            value={carNumber}
            onChange={(e) => checkIndianCarNumber(e.target.value)}
            aria-invalid={!isCorrectCarNumber && carNumber.length > 0}
          />
        </div>

        {/* Location Dropdown */}
        {locations.length > 0 && (
          <div>
            <label className="block mb-1 text-xs font-semibold text-slate-600 uppercase">Dealership Location</label>
            <select
              value={locationId}
              onChange={(e) => {
                const locId = e.target.value;
                setLocationId(locId);
                const selectedLoc = locations.find((l) => l.id === locId);
                if (selectedLoc?.isBodyshop || selectedLoc?.is_bodyshop) {
                  const bsType = serviceTypes.find((s) => s.bodyshopOnly || s.bodyshop_only || /bodyshop/i.test(s.name));
                  if (bsType) setServiceType(bsType.name);
                }
              }}
              className="w-full p-2 border border-slate-300 rounded text-sm bg-white font-medium text-slate-800"
            >
              <option value="">Default Location</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} {loc.isBodyshop || loc.is_bodyshop ? "(Bodyshop)" : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Service Type Dropdown */}
        {serviceTypes.length > 0 && (
          <div>
            <label className="block mb-1 text-xs font-semibold text-slate-600 uppercase">Service Type</label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded text-sm bg-white font-medium text-slate-800"
            >
              <option value="">Select Service Type</option>
              {serviceTypes.map((st) => (
                <option key={st.id} value={st.name}>
                  {st.name} {st.bodyshopOnly || st.bodyshop_only ? "(Bodyshop Only)" : ""}
                </option>
              ))}
            </select>
          </div>
        )}


        <div className="w-full">
          <label className="block mb-1 text-xs font-semibold text-slate-600 uppercase">Car Make *</label>
          <SearchSelect
            data={carMakeModels.map((m) => m.company)}
            type="Car Makes"
            setDataValue={handleCarMakeChange}
            value={carMake}
          />
        </div>

        <div className="w-full">
          <label className="block mb-1 text-xs font-semibold text-slate-600 uppercase">Car Model *</label>
          <SearchSelect
            data={selectedCarMakeModels}
            type="Car Models"
            setDataValue={setCarModel}
            disabled={handleModelDisable}
            value={carModel}
          />
        </div>

        {/* Purpose of Visit */}
        <div className="w-full">
          <label className="block mb-2 font-medium">Purpose of Visit</label>

          <div className="mb-3 flex items-center space-x-2">
            <Checkbox
              id="checkbox-1"
              checked={includeCode1}
              onCheckedChange={(v) => setIncludeCode1(Boolean(v))}
            />
            <label htmlFor="checkbox-1" className="cursor-pointer">
              {purposeOfVisits.find((p) => p.code === 1)?.description ?? "Option 1"}
            </label>
          </div>

          <RadioGroup
            value={selectedRadioCode}
            onValueChange={(val) => setSelectedRadioCode(val)}
            className="space-y-2"
          >
            {purposeOfVisits
              .filter((p) => p.code !== 1)
              .map((p) => {
                const codeStr = String(p.code);
                const id = `radio-${codeStr}`;
                return (
                  <div key={codeStr} className="flex items-center space-x-2">
                    <RadioGroupItem id={id} value={codeStr} />
                    <label htmlFor={id} className="cursor-pointer">
                      {p.description}
                    </label>
                  </div>
                );
              })}
          </RadioGroup>

          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            type="button"
            onClick={clearPurposes}
            disabled={isButtonLoading || isFetching}
          >
            Clear Purposes
          </Button>
        </div>

        <Button
          type="button"
          color="#EF4444"
          disabled={isSubmitDisabled}
          onClick={handleAddCar}
        >
          {isButtonLoading ? (
            <Image src={loader} width={50} height={50} alt="Loading" />
          ) : (
            <div>Add Vehicle</div>
          )}
        </Button>
      </div>
    </div>
  );
}

