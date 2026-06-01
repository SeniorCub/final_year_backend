import type { Request, Response } from 'express';

export const getUsers = async (req: Request, res: Response): Promise<void> => {
     res.status(200).json({ success: true, message: 'Get users route' });
};

export const getUser = async (req: Request, res: Response): Promise<void> => {
     res.status(200).json({ success: true, message: 'Get single user route' });
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
     res.status(200).json({ success: true, message: 'Update user route' });
};
