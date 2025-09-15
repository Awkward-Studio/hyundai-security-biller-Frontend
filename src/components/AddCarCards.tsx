"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { SearchSelect } from "./SearchSelect";
import loader from "../../public/assets/t3-loader.gif";
import { toast } from "sonner";

import { createCarWithTemp, fetchCarMakeAndModels } from "@/lib/appwrite";
import { purposeOfVisits } from "@/lib/helper";
import { RadioGroup, RadioGroupItem } from "./ui/radioGroup";
import { Checkbox } from "@/components/ui/checkbox";

type Props = {};

type MakeModels = { company: string; models: string[] };

const indianCarNumberRegex =
  /^(?:[A-Z]{2}\d{2}[A-Z]{1,5}\d{4}|\d{2}BH\d{4}[A-Z]{1,2})$/;

export default function AddCarCards({}: Props) {
  const router = useRouter();

  // form state
  const [carNumber, setCarNumber] = useState("");
  const [isCorrectCarNumber, setIsCorrectCarNumber] = useState(false);

  const [carMake, setCarMake] = useState<string>("Hyundai");
  const [carModel, setCarModel] = useState<string>("");
  const [handleModelDisable, setHandleModelDisable] = useState(false);

  const [carMakeModels, setCarMakeModels] = useState<MakeModels[]>([]);
  const [selectedCarMakeModels, setSelectedCarMakeModels] = useState<string[]>(
    []
  );

  const [includeCode1, setIncludeCode1] = useState<boolean>(false);
  const [selectedRadioCode, setSelectedRadioCode] = useState<
    string | undefined
  >(undefined);

  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setIsFetching(true);
      try {
        const data = await fetchCarMakeAndModels();
        const formatted: MakeModels[] = (data?.documents ?? []).map(
          (doc: any) => ({
            company: String(doc.make ?? ""),
            models: Array.isArray(doc.models) ? doc.models.map(String) : [],
          })
        );
        if (!mounted) return;
        setCarMakeModels(formatted);
        setCarMake("Hyundai");
        console.log(formatted);
        const found = formatted.find((m) => m.company === "Hyundai");
        const nextModels = found?.models ?? [];
        setSelectedCarMakeModels(nextModels);
        console.log(found);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Unknown error occurred";
        console.error("Failed to fetch car makes/models:", err);
        toast.error(`Couldn't load car makes/models: ${message}`);
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

  // const handleCarMakeChange = (value: string) => {
  //   try {
  //     setHandleModelDisable(true);
  //     setCarMake(value);
  //     setCarModel("");

  //     const found = carMakeModels.find((m) => m.company === value);
  //     const nextModels = found?.models ?? [];
  //     setSelectedCarMakeModels(nextModels);
  //     setHandleModelDisable(nextModels.length === 0);
  //   } catch (err) {
  //     const message = err instanceof Error ? err.message : String(err);
  //     console.error("Error in handleCarMakeChange:", message);
  //     setSelectedCarMakeModels([]);
  //     setHandleModelDisable(true);
  //     toast.error("Failed to update models for selected make.");
  //   }
  // };

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
      const payload = {
        carNumber,
        carMake,
        carModel,
        purposesOfVisit: purposes,
      };

      const created = await createCarWithTemp(payload);
      if (!created) throw new Error("Create failed");

      toast.success("Vehicle added ✅");
      router.push("/security");
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Unknown error occurred while adding";
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
        <Input
          id="carNumber"
          placeholder="Car Number"
          value={carNumber}
          onChange={(e) => checkIndianCarNumber(e.target.value)}
          aria-invalid={!isCorrectCarNumber && carNumber.length > 0}
        />

        {/* <div className="w-full">
          <SearchSelect
            data={carMakeModels.map((m) => m.company)}
            type="Car Makes"
            setDataValue={handleCarMakeChange}
            value={carMake}
          />
        </div> */}

        <div className="w-full">
          <SearchSelect
            data={selectedCarMakeModels}
            type="Car Models"
            setDataValue={setCarModel}
            disabled={handleModelDisable}
            value={carModel}
          />
        </div>

        {/* Purpose of Visit (advisor-free) */}
        <div className="w-full">
          <label className="block mb-2 font-medium">Purpose of Visit</label>

          {/* code 1 as optional checkbox */}
          <div className="mb-3 flex items-center space-x-2">
            <Checkbox
              id="checkbox-1"
              checked={includeCode1}
              onCheckedChange={(v) => setIncludeCode1(Boolean(v))}
            />
            <label htmlFor="checkbox-1" className="cursor-pointer">
              {purposeOfVisits.find((p) => p.code === 1)?.description ??
                "Option 1"}
            </label>
          </div>

          {/* other codes as single-select radio (string-based) */}
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
