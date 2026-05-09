import { Request, Response, NextFunction } from 'express';

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
     console.error(err.stack);
     res.status(err.status || 500).json({
          success: false,
          error: err.message || 'Server Error'
     });
};

export default errorHandler;
