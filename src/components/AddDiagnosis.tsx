"use client";

import React, { useEffect, useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Plus, Trash2 } from "lucide-react";

const AddDiagnosis = ({ setCarDiagnosis }: any) => {
  const [tempDiagnosis, setTempDiagnosis] = useState([
    {
      id: Math.random().toString(36).slice(2),
      diagnosis: "",
    },
  ]);

  useEffect(() => {
    console.log("UPDATED", tempDiagnosis);
  }, [tempDiagnosis]);

  const addDiagnosisPoint = () => {
    setTempDiagnosis([
      ...tempDiagnosis,
      { id: Math.random().toString(36).slice(2), diagnosis: "" },
    ]);
    setCarDiagnosis([
      ...tempDiagnosis,
      { id: Math.random().toString(36).slice(2), diagnosis: "" },
    ]);
  };

  const handleEditDiagnosisPoint = (input: any, pointId: any) => {
    console.log("Input - ", input);
    console.log("Point ID - ", pointId);

    let findIndex = tempDiagnosis.findIndex((point) => point.id == pointId);

    let arrayFirstHalf = tempDiagnosis.slice(0, findIndex);
    let arraySecondHalf = tempDiagnosis.slice(findIndex + 1);

    setTempDiagnosis([
      ...arrayFirstHalf,
      { id: pointId, diagnosis: input },
      ...arraySecondHalf,
    ]);

    setCarDiagnosis([
      ...arrayFirstHalf,
      { id: pointId, diagnosis: input },
      ...arraySecondHalf,
    ]);
  };

  const deleteDiagnosisPoint = (pointId: any) => {
    // console.log("BEFORE - ", tempDiagnosis);
    let deleteIndex = tempDiagnosis.findIndex((point) => point.id == pointId);
    // console.log("This is the deleteIndex - ", deleteIndex);
    let arrayFirstHalf = tempDiagnosis.slice(0, deleteIndex);
    let arraySecondHalf = tempDiagnosis.slice(deleteIndex + 1);

    // console.log("Array First Half -", arrayFirstHalf);
    // console.log("Array Second Half -", arraySecondHalf);

    setTempDiagnosis([...arrayFirstHalf, ...arraySecondHalf]);
    setCarDiagnosis([...arrayFirstHalf, ...arraySecondHalf]);

    // let newArr = tempDiagnosis;

    // newArr.splice(
    //   newArr.findIndex((point) => point.id == pointId),
    //   1
    // );
    // console.log("AFTER - ", newArr);
    // setTempDiagnosis((prev) => newArr);
    // setTempDiagnosis(tempDiagnosis);
    // console.log(tempDiagn
  };

  return (
    <div className="space-y-4">
      {tempDiagnosis.map((point, index) => (
        <div key={point.id} className="flex items-center">
          <Input
            type="text"
            value={point.diagnosis}
            placeholder="Enter diagnosis"
            onChange={(e) => handleEditDiagnosisPoint(e.target.value, point.id)}
            className="flex-1 p-3 border-2 border-gray-300 rounded-xl focus:border-gray-700 text-base font-semibold text-black"
          />
          {index === tempDiagnosis.length - 1 ? (
            <Button
              onClick={addDiagnosisPoint}
              className="ml-3 bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-600 transition-colors"
            >
              <Plus />
            </Button>
          ) : (
            <Button
              onClick={() => deleteDiagnosisPoint(point.id)}
              className="ml-3 bg-gray-500 text-white px-4 py-2 rounded-xl hover:bg-gray-600 transition-colors"
            >
              <Trash2 />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
};

export default AddDiagnosis;
