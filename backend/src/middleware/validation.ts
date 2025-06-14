
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validateSMTPConfig = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    server: Joi.string().required(),
    port: Joi.number().integer().min(1).max(65535).required(),
    username: Joi.string().allow(''),
    password: Joi.string().allow(''),
    useAuth: Joi.boolean().required(),
    useSSL: Joi.boolean().required(),
    subject: Joi.string().required(),
    message: Joi.string().required(),
    recipients: Joi.array().items(Joi.string().email()).min(1).required(),
    threads: Joi.number().integer().min(1).max(100).required(),
    emailsPerThread: Joi.number().integer().min(1).required(),
    delay: Joi.number().integer().min(0).required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  next();
};

export const validateTestId = (req: Request, res: Response, next: NextFunction) => {
  const { testId } = req.params;
  
  if (!testId || typeof testId !== 'string') {
    return res.status(400).json({ error: 'Valid test ID is required' });
  }

  next();
};
