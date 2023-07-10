import { NextFunction, Request, request, Response } from 'express';

const useSimpleGeolocation = (req: Request, res: Response, next: NextFunction) => {
  let ip = req.socket.remoteAddress;
  next();
};

export default useSimpleGeolocation;
