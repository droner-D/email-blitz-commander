
import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validateSMTPConfig = [
  body('server').notEmpty().withMessage('Server is required'),
  body('port').isInt({ min: 1, max: 65535 }).withMessage('Port must be between 1 and 65535'),
  body('username').optional().isString(),
  body('password').optional().isString(),
  body('fromEmail').optional().isEmail().withMessage('From email must be valid'),
  body('useSSL').isBoolean().withMessage('SSL option must be boolean'),
  body('useAuth').isBoolean().withMessage('Auth option must be boolean'),
  body('recipients').isArray({ min: 1 }).withMessage('At least one recipient is required'),
  body('recipients.*').isEmail().withMessage('All recipients must be valid emails'),
  body('subject').notEmpty().withMessage('Subject is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('threads').isInt({ min: 1, max: 100 }).withMessage('Threads must be between 1 and 100'),
  body('totalEmails').optional().isInt({ min: 1 }).withMessage('Total emails must be positive'),
  body('testMode').isIn(['count', 'duration', 'continuous']).withMessage('Invalid test mode'),
  body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be positive'),
  body('delay').optional().isInt({ min: 0 }).withMessage('Delay must be non-negative'),
  body('attachmentPath').optional().isString(),
  body('customHeaders').optional().isObject().withMessage('Custom headers must be an object'),
  
  // Custom validation to ensure proper test configuration
  body().custom((value) => {
    const { testMode, totalEmails, duration } = value;
    
    if (testMode === 'count' && (!totalEmails || totalEmails < 1)) {
      throw new Error('Count mode requires totalEmails parameter');
    }
    
    if (testMode === 'duration' && (!duration || duration < 1)) {
      throw new Error('Duration mode requires duration parameter');
    }
    
    if (testMode === 'continuous' && (totalEmails || duration)) {
      throw new Error('Continuous mode should not specify totalEmails or duration');
    }
    
    return true;
  }),
];

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};
