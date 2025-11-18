import { IndianRupee } from "lucide-react";
import React from "react";

export default function DisplayCard({ icon, desc, value, button }: any) {
  return (
    <div className="flex flex-col justify-between w-full lg:h-[220px] lg:min-w-[280px] lg:w-[416px] border-2 border-gray-200 rounded-lg shadow-sm p-4">
      <div>
        <div className="flex justify-between items-start">
          <div className="border-2 rounded-lg p-3 w-fit mb-6">{icon}</div>
          {button && <div className="">{button}</div>}
        </div>
        <div className="text-sm text-gray-500">{desc}</div>

        <div className="text-3xl font-semibold mt-4">
          {desc === "Revenue So far" ? (
            <div className="flex space-x-2 items-center">
              <IndianRupee />
              {value.toLocaleString("en-IN")}
            </div>
          ) : (
            value
          )}
        </div>
      </div>
    </div>
  );
}
