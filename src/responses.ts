export interface SuccessResponse<T> {
  success: true;
  data: T;
}

export interface ErrorResponse {
  success: false;
  error: string;
}

export type Response<T> = SuccessResponse<T> | ErrorResponse;

export interface InsertResponse {
  success: true;
  insertedId: any;
}

export interface UpdateResponse {
  success: true;
  matchedCount: number;
  modifiedCount: number;
}

export interface DeleteResponse {
  success: true;
  deletedCount: number;
}
