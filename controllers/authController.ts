import type { Request, Response } from 'express';

export const register = async (req: Request, res: Response): Promise<void> => {
     res.status(200).json({ success: true, message: 'Register route' });
};

export const login = async (req: Request, res: Response): Promise<void> => {
     res.status(200).json({ success: true, message: 'Login route' });
};
