import { Response } from 'express';
import { resMessage, resError, resStatus } from './types/Response.types';

export default interface IResponse extends Response {}
export interface TypedResponse<T> {
  succes: boolean;
  data: T;
  message: string;
  error: any;
}
