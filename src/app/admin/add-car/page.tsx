"use client";

import React, { useState, useEffect } from "react";
import PrimaryButton from "@/components/PrimaryButton";
import { Input } from "@/components/ui/input";
import { addCarMake, addCarModel, fetchCarMakeAndModels } from "@/lib/api";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {};

function AddCarModel({}: Props) {
  const [makeName, setMakeName] = useState("");
  const [ModelName, setModelName] = useState<string>(""); // Initialized to an empty string
  const [isAddingMake, setIsAddingMake] = useState(false);
  const [isAddingModel, setIsAddingModel] = useState(false);
  const [makes, setMakes] = useState<
    { id: string; make: string; models: string[] }[]
  >([]);

  const [selectedMake, setSelectedMake] = useState<string | null>(null);
  const [selectedMakeId, setSelectedMakeId] = useState<string | null>(null);

  const handleMakeChange = (make: string) => {
    setSelectedMake(make);

    // Find the ID of the selected make
    const makeObject = makes.find((item) => item.make === make);
    setSelectedMakeId(makeObject ? makeObject.id : null);

    console.log("Selected Make: ", selectedMake);
    console.log("Selected Make ID: ", selectedMakeId);
  };

  const loadMakes = async () => {
    try {
      const data = await fetchCarMakeAndModels();
      setMakes(data.documents.map((doc) => ({
        id: doc.$id,
        make: doc.make,
        models: doc.models || [],
      })));
    } catch (error) {
      toast.error("Failed to fetch makes");
    }
  };

  useEffect(() => {
    loadMakes();
  }, []);

  const addCarMakeHandler = async () => {
    const name = makeName.trim();
    if (!name) return toast.error("Enter a make name");
    setIsAddingMake(true);
    try {
      await addCarMake(name);
      toast.success("Car make added successfully");
      setMakeName("");
      await loadMakes();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add car make");
    } finally {
      setIsAddingMake(false);
    }
  };

  const addCarModelHandler = async () => {
    const name = ModelName.trim();
    if (!name || !selectedMakeId) {
      return toast.error(!selectedMakeId ? "Select a make first" : "Enter a model name");
    }
    setIsAddingModel(true);
    try {
      await addCarModel(selectedMakeId, name);
      toast.success("Car model added successfully");
      setModelName("");
      await loadMakes();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add car model");
    } finally {
      setIsAddingModel(false);
    }
  };

  return (
    <div className="w-full max-w-5xl px-6 py-12 lg:px-12 lg:py-16">
      <div className="mb-10">
        <div className="font-semibold text-3xl tracking-tight">Car Makes &amp; Models</div>
        <div className="mt-2 text-gray-500">Manage the makes and models available when adding a car.</div>
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-5">
            <div className="font-semibold text-xl">Add a make</div>
            <div className="mt-1 text-sm text-gray-500">Create a brand that can be selected for new vehicles.</div>
          </div>
          <div className="space-y-3">
            <label className="block text-sm font-medium">Make name</label>
            <Input
              placeholder="e.g. Hyundai"
              value={makeName}
              onChange={(e) => setMakeName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCarMakeHandler()}
            />
            <PrimaryButton className="w-full" title="Add Make" handleButtonPress={addCarMakeHandler} isLoading={isAddingMake} />
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-5">
            <div className="font-semibold text-xl">Add a model</div>
            <div className="mt-1 text-sm text-gray-500">Attach a model to one of your existing makes.</div>
          </div>
        {/* Dropdown for selecting car make */}
        <div>
          <label className="block mb-2 font-medium">Select Make</label>
          <Select
            value={selectedMake || ""}
            onValueChange={handleMakeChange} // Updated handler
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a Make" />
            </SelectTrigger>
            <SelectContent>
              {makes.map((item) => (
                <SelectItem key={item.id} value={item.make}>
                  {item.make}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Input for car model */}
        <div>
          <label className="block mb-2 font-medium">Model Name</label>
          <Input
            id="modelName"
            placeholder="Model Name"
            value={ModelName} // Controlled input
            onChange={(e) => setModelName(e.target.value)}
          />
        </div>

        {/* Add Car Button */}
        <PrimaryButton className="w-full" title="Add Model" handleButtonPress={addCarModelHandler} isLoading={isAddingModel} />
        </div>

        <div className="rounded-2xl border bg-gray-50 p-6 lg:col-span-2">
          <div className="mb-4">
            <div className="font-semibold text-xl">Available catalog</div>
            <div className="mt-1 text-sm text-gray-500">These options are shown to security staff when they add a car.</div>
          </div>
          <div className="space-y-3">
            {makes.map((item) => (
              <div key={item.id} className="rounded-md border p-4">
                <div className="font-medium">{item.make}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {item.models.length ? item.models.join(", ") : "No models added yet"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddCarModel;
