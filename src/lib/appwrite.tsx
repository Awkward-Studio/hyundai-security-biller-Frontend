import {
  Client,
  Account,
  Databases,
  Query,
  ID,
  Storage,
  Functions,
} from "appwrite";
import ImageKit from "imagekit";
import { BaseRepository } from "./BaseRepo";

/* =========================
   CONFIG
   ========================= */
export const config = {
  endpoint: "https://cloud.appwrite.io/v1",
  projectId: "68b88b40001f2371960a",
  databaseId: "68b88c630024ee6a3634",
  carsCollectionId: "68b88df3002567b90f03",
  tempCarsCollectionId: "68b88dfd002f0bdde103",
  carModelsCollectionId: "68b88e09002d9a3fa2d8",
  pdfStorageBucketId: "68b88fb6001a35f16231",
  invoiceStorageBucketId: "68b88fb6001a35f16231",
  imageStorageBucketId: "67053962002be8598a04",
};

export let client: Client;
export let account: Account;
export let databases: Databases;
export let storage: Storage;
export let functions: Functions;

client = new Client();
client.setEndpoint(config.endpoint).setProject(config.projectId);

account = new Account(client);
databases = new Databases(client);
storage = new Storage(client);
functions = new Functions(client);

// /* =========================
//    IMAGEKIT
//    ========================= */
// export const imagekit = new ImageKit({
//   publicKey: "public_YxeQGi/zYRicR5GdhQu7UwOMAYg=",
//   privateKey: "private_pPkQ38mNRgbbpt9JElST4HPGQfw=",
//   urlEndpoint: "https://ik.imagekit.io/ztq7tvia1",
// });

/* =========================
   ENV
   ========================= */
const useDev = false;
let apiUrl = useDev
  ? "http://localhost:3000"
  : "https://hyundai-garage-frontend.vercel.app/";

/* =========================
   TABLE SHAPES 
   ========================= */
// Cars
export interface CarRecord {
  $id?: string;
  carNumber: string;
  carMake: string;
  carModel: string;
  location?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerAddress?: string | null;
  customerEmail?: string | null;
  purposesOfVisit: string[];
}

// Temp Cars
export interface TempCarRecord {
  $id?: string;
  carNumber: string;
  carMake: string;
  carModel: string;
  location?: string | null;
  carStatus: CarStatus;
  carsTableId: string;
  purposesOfVisit: string[];
  redundant?: boolean;
  gatePassPDF?: string | null;
}

export enum CarStatus {
  ENTERED = "ENTERED", // security created car
  IN_PROGRESS = "IN_PROGRESS", // biller set WIP
  DONE = "DONE", // work completed
  GATEPASS_GENERATED = "GATEPASS_GENERATED", // gatepass generated
  EXITED = "EXITED", // exited by security
}

// CarModels
export interface CarModelDoc {
  $id: string;
  make: string;
  models: string[];
}

/* =========================
   SESSION HELPERS
   ========================= */

export const checkActiveSession = async () => {
  try {
    const session = await account.getSession("current");
    return session !== null;
  } catch (error: any) {
    if (error.code === 401) return false;
    throw error;
  }
};

export const deleteSessions = async () => {
  try {
    const sessions = await account.listSessions();
    await Promise.all(
      sessions.sessions.map(async (session: { $id: string }) =>
        account.deleteSession(session.$id)
      )
    );
  } catch (error: any) {
    console.error("Error deleting sessions:", error.message);
    throw error;
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    try {
      const active = await checkActiveSession();
      if (active) await deleteSessions();
    } catch (e: any) {
      if (!(e.message?.includes("missing scope") || e.code === 401)) throw e;
    }

    const currentIp = await fetch("https://api64.ipify.org?format=json")
      .then((r) => r.json())
      .then((d) => d.ip)
      .catch(() => null);

    try {
      const sessions = await account.listSessions();
      for (const session of sessions.sessions) {
        if (session.providerUid === email && session.ip === currentIp) {
          await account.deleteSession(session.$id);
          break;
        }
      }
    } catch (e: any) {
      if (!(e.message?.includes("missing scope") || e.code === 401)) throw e;
    }

    const sessionDetails = await account.createEmailPasswordSession(
      email,
      password
    );
    const userDetails = await account.get();
    return { userDetails, sessionDetails };
  } catch (error: any) {
    return { errorMsg: error.message };
  }
};

export const listAllUsers = async () => {
  const response = await functions.createExecution("6731d19d00250e7e0b6f");
  const obj = JSON.parse(response.responseBody);
  return obj.users.users;
};

export const listSessions = async () => {
  try {
    return await account.listSessions();
  } catch (error: any) {
    console.log(error.message);
    return null;
  }
};

export const logoutUser = async () => {
  try {
    const result = await account.deleteSessions();
    return { success: true, result };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
};

export const getCurrentUser = async () => {
  try {
    return await account.get();
  } catch {
    return null;
  }
};

/* =========================
   CARS & TEMP CARS
   ========================= */

/** Create a row in Cars. */
export const createCar = async (payload: CarRecord) => {
  try {
    const baseRepo = new BaseRepository(config.carsCollectionId);

    // Basic normalization
    const doc: CarRecord = {
      carNumber: payload.carNumber.trim().toUpperCase(),
      carMake: payload.carMake,
      carModel: payload.carModel,
      location: payload.location ?? null,
      customerName: payload.customerName ?? null,
      customerPhone: payload.customerPhone ?? null,
      customerAddress: payload.customerAddress ?? null,
      customerEmail: payload.customerEmail ?? null,
      purposesOfVisit: (payload.purposesOfVisit ?? []).map(String),
    };

    const result = await baseRepo.createDocument(doc);
    return result;
  } catch (error: any) {
    console.log(error.message);
    return null;
  }
};

/** Create a row in Temp Cars (security entry). */
export const createTempCar = async (payload: TempCarRecord) => {
  try {
    const baseRepo = new BaseRepository(config.tempCarsCollectionId);

    const doc: TempCarRecord = {
      carNumber: payload.carNumber.trim().toUpperCase(),
      carMake: payload.carMake,
      carModel: payload.carModel,
      location: payload.location ?? null,
      carStatus: payload.carStatus, // string enum value
      carsTableId: payload.carsTableId,
      purposesOfVisit: (payload.purposesOfVisit ?? []).map(String),
      redundant: payload.redundant ?? false,
      gatePassPDF: payload.gatePassPDF ?? null,
    };

    const result = await baseRepo.createDocument(doc);
    return result;
  } catch (error: any) {
    console.log("TEMP CAR CREATE ERROR - ", error.message);
    return null;
  }
};

export const createCarWithTemp = async (
  car: Omit<CarRecord, "$id">,
  location?: string | null
) => {
  const newCar = await createCar({ ...car, location: location ?? null });
  if (!newCar) return null;

  const temp = await createTempCar({
    carNumber: car.carNumber,
    carMake: car.carMake,
    carModel: car.carModel,
    location: location ?? null,
    carStatus: CarStatus.ENTERED, // string
    carsTableId: newCar.$id,
    purposesOfVisit: car.purposesOfVisit,
    redundant: false,
    gatePassPDF: null,
  });

  return { car: newCar, tempCar: temp };
};

/** Get temp cars, optionally filtered by status list. */
export const getAllTempCars = async (statuses?: CarStatus[]) => {
  const finalQuery: any[] = [
    Query.orderDesc("$createdAt"),
    Query.limit(999999),
  ];
  if (statuses && statuses.length) {
    if (statuses.length > 1) {
      const orClauses = statuses.map((s) => Query.equal("carStatus", [s]));
      finalQuery.push(Query.or(orClauses));
    } else {
      finalQuery.push(Query.equal("carStatus", [statuses[0]]));
    }
  }
  try {
    return await databases.listDocuments(
      config.databaseId,
      config.tempCarsCollectionId,
      finalQuery
    );
  } catch (error: any) {
    console.log(error.message);
    return null;
  }
};

export const getAllCars = async () => {
  try {
    return await databases.listDocuments(
      config.databaseId,
      config.carsCollectionId,
      []
    );
  } catch (error: any) {
    console.log(error.message);
    return null;
  }
};

export const getCarByCarNumber = async (carNumber: string) => {
  try {
    return await databases.listDocuments(
      config.databaseId,
      config.carsCollectionId,
      [
        Query.equal("carNumber", carNumber.toUpperCase()),
        Query.orderDesc("$createdAt"),
      ]
    );
  } catch (error: any) {
    console.log(error.message);
    return null;
  }
};

export const getCarById = async (id: string) => {
  try {
    return await databases.getDocument(
      config.databaseId,
      config.carsCollectionId,
      id
    );
  } catch (error: any) {
    console.log(error.message);
    return null;
  }
};

export const getTempCarById = async (id: string) => {
  try {
    return await databases.getDocument(
      config.databaseId,
      config.tempCarsCollectionId,
      id
    );
  } catch {
    return null;
  }
};

export const updateTempCarById = async (id: string, carStatus: CarStatus) => {
  try {
    const repo = new BaseRepository(config.tempCarsCollectionId);
    return await repo.updateDocumentById(id, { carStatus }); // string enum
  } catch (error: any) {
    console.log(error.message);
    return null;
  }
};

export const updateTempCarFieldsById = async (
  id: string,
  data: Partial<TempCarRecord>
) => {
  try {
    const repo = new BaseRepository(config.tempCarsCollectionId);
    return await repo.updateDocumentById(id, data);
  } catch (error: any) {
    console.log(error.message);
    return null;
  }
};

export const updateCarField = async <K extends keyof CarRecord>(
  id: string,
  fieldName: K,
  fieldValue: CarRecord[K]
) => {
  try {
    const repo = new BaseRepository(config.carsCollectionId);
    await repo.updateDocumentById(id, { [fieldName]: fieldValue } as any);
    return true;
  } catch (error: any) {
    console.error(
      `Failed to update field "${String(fieldName)}": ${error.message}`
    );
    return null;
  }
};

export const updateTempCarField = async <K extends keyof TempCarRecord>(
  id: string,
  fieldName: K,
  fieldValue: TempCarRecord[K]
) => {
  try {
    const repo = new BaseRepository(config.carsCollectionId);
    await repo.updateDocumentById(id, { [fieldName]: fieldValue } as any);
    return true;
  } catch (error: any) {
    console.error(
      `Failed to update field "${String(fieldName)}": ${error.message}`
    );
    return null;
  }
};

export const deleteTempCarById = async (id: string) => {
  try {
    return await databases.deleteDocument(
      config.databaseId,
      config.tempCarsCollectionId,
      id
    );
  } catch (error: any) {
    console.log(error.message);
    return null;
  }
};

/** Search in Temp Cars by partial carNumber and optional statuses */
export const searchTempCar = async (
  searchTerm: string,
  statuses?: CarStatus[]
) => {
  const q: any[] = [Query.contains("carNumber", [searchTerm.toUpperCase()])];
  if (statuses && statuses.length) {
    if (statuses.length > 1) {
      const orClauses = statuses.map((s) => Query.equal("carStatus", [s]));
      q.push(Query.or(orClauses));
    } else {
      q.push(Query.equal("carStatus", [statuses[0]]));
    }
  }
  try {
    return await databases.listDocuments(
      config.databaseId,
      config.tempCarsCollectionId,
      q
    );
  } catch (error: any) {
    console.log(error.message);
    return null;
  }
};

/* =========================
   FILES (unchanged behavior)
   ========================= */

export const uploadPDF = async (buffer: Buffer, fileName = "document.pdf") => {
  try {
    const blob = new Blob([new Uint8Array(buffer)], {
      type: "application/pdf",
    });
    const file = new File([blob], fileName, { type: "application/pdf" });
    const result = await storage.createFile(
      config.pdfStorageBucketId,
      ID.unique(),
      file
    );
    const downloadUrl = storage.getFileView(
      config.pdfStorageBucketId,
      result.$id
    ).href;
    return { id: result.$id, downloadUrl: downloadUrl.toString() };
  } catch (error: any) {
    console.error("UPLOAD ERROR:", error.message);
    return null;
  }
};

// export const getImageUrl = async (id: string) => {
//   try {
//     return storage.getFileView(config.imageStorageBucketId, id);
//   } catch (error: any) {
//     console.log("FETCH ERROR - ", error.message);
//     return null;
//   }
// };

export const uploadInvoice = async (file: File) => {
  try {
    return await storage.createFile(
      config.invoiceStorageBucketId,
      ID.unique(),
      file,
      []
    );
  } catch (error: any) {
    console.log("THIS IS ERROR - ", error.message);
    return null;
  }
};

export const getInvoiceUrl = async (id: string) => {
  try {
    return storage.getFileView(config.invoiceStorageBucketId, id);
  } catch (error: any) {
    console.log("THIS IS ERROR - ", error.message);
    return null;
  }
};

/* =========================
   CAR MODELS (typed)
   ========================= */
export const addCarModel = async (carMakeId: string, carModel: string) => {
  try {
    const repo = new BaseRepository(config.carModelsCollectionId);
    const document = (await repo.getDocumentById(carMakeId)) as CarModelDoc;
    const updated = [...(document.models ?? []), carModel];
    return await repo.updateDocumentById(carMakeId, { models: updated });
  } catch (error) {
    console.error("Error updating document:", error);
    return null;
  }
};

export const fetchCarMakeAndModels = async () => {
  const repo = new BaseRepository(config.carModelsCollectionId);
  const res = await repo.listDocuments([Query.limit(999999)]);
  return res;
};
