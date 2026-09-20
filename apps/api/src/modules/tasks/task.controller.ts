import { Request, Response, NextFunction } from 'express';
import { TaskService } from './task.service.js';
import { CreateTaskSchema } from '@demurrageos/shared-types';
import { ValidationError } from '../../common/errors/app-error.js';

export class TaskController {
  public static async createTask(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const parsed = CreateTaskSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Invalid task payload', parsed.error.format());
      }

      const result = await TaskService.createTask(user, parsed.data);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async getContainerTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const containerId = String(req.params.containerId);
      const tasks = await TaskService.getContainerTasks(user, containerId);
      res.json({ data: tasks });
    } catch (err) {
      next(err);
    }
  }

  public static async revokeTask(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const taskId = String(req.params.id);
      const updated = await TaskService.revokeToken(user, taskId);
      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  }
}
