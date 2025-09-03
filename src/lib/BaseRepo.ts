import { databases, config } from "@/lib/appwrite";
import { ID } from "appwrite";

export class BaseRepository {
  private readonly collectionId: string;
  private readonly databaseId: string = config.databaseId;

  constructor(collectionId: string) {
    this.collectionId = collectionId;
  }

  // Create a document
  async createDocument(data: any): Promise<any> {
    try {
      const createdDoc = await databases.createDocument(
        this.databaseId,
        this.collectionId,
        ID.unique(),
        data
      );
      return createdDoc;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  // Get a document by ID
  async getDocumentById(documentId: string): Promise<any> {
    try {
      return await databases.getDocument(
        this.databaseId,
        this.collectionId,
        documentId
      );
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  // Update a document by ID
  async updateDocumentById(documentId: string, data: any): Promise<any> {
    try {
      const updatedDoc = await databases.updateDocument(
        this.databaseId,
        this.collectionId,
        documentId,
        data
      );
      return updatedDoc;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  // List documents with optional queries
  async listDocuments(query: any[] = []): Promise<any> {
    try {
      return await databases.listDocuments(
        this.databaseId,
        this.collectionId,
        query
      );
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  // Delete a document by ID
  async deleteDocumentById(documentId: string): Promise<any> {
    try {
      const result = await databases.deleteDocument(
        this.databaseId,
        this.collectionId,
        documentId
      );
      return result;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  // Error handler
  private handleError(error: any): any {
    const message = error?.message ?? "Unknown error";
    console.error("Appwrite Error:", message);
    return { error: message };
  }
}
