import type { Request, Response } from "express";
import type { Priority, Status } from "../types";
import {
    createTask,
    deleteTask,
    getTaskById,
    getTasksByUser,
    markTaskAsCompleted,
    updateTask,
    type GetTasksOptions,
    type UpdateTaskInput
} from "../services/tasks.service";

type TaskSortBy = "created_at" | "due_date";
type SortOrder = "asc" | "desc";

function isStatus(status: unknown): status is Status {
    return status === "TODO" || status === "IN_PROGRESS" || status === "COMPLETED";
}

function isPriority(priority: unknown): priority is Priority {
    return priority === "LOW" || priority === "MEDIUM" || priority === "HIGH";
}

function isTaskSortBy(sortBy: unknown): sortBy is TaskSortBy {
    return sortBy === "created_at" || sortBy === "due_date";
}

function isSortOrder(sortOrder: unknown): sortOrder is SortOrder {
    return sortOrder === "asc" || sortOrder === "desc";
}

function toDate(value: unknown, fieldName: string) {
    if (value === undefined || value === null || value === "")
        return undefined;

    const date = new Date(String(value));

    if (Number.isNaN(date.getTime()))
        throw Error (`Invalid ${fieldName}!`);

    return date;
}

function getUserId(req: Request) {
    return req.userJWT?.sub ?? "";
}

function getTaskId(req: Request) {
    const taskId = req.params.id;

    if (!taskId || Array.isArray(taskId))
        throw Error ("Invalid Task!");

    return taskId;
}

function sendControllerError(res: Response, error: unknown, fallback: string) {
    const message = error instanceof Error ? error.message : fallback;
    const status = message.toLowerCase().includes("not found") ? 404 : 400;

    res.status(status).json({ message });
}

// create task controller
export async function createTaskController(req: Request, res: Response) {
    try {
        const {
            title,
            description = null,
            status = "TODO",
            priority = "MEDIUM",
            dueDate
        } = req.body;

        if (typeof title !== "string")
            throw Error ("Title must be a string!");

        if (description !== null && description !== undefined && typeof description !== "string")
            throw Error ("Description must be a string!");

        if (!isStatus(status))
            throw Error ("Invalid status!");

        if (!isPriority(priority))
            throw Error ("Invalid priority!");

        const parsedDueDate = toDate(dueDate, "due date") ?? new Date();
        const task = await createTask(
            getUserId(req),
            title,
            description,
            status,
            priority,
            parsedDueDate,
            new Date()
        );

        res.status(201).json(task);
    }
    catch (error) {
        sendControllerError(res, error, "Failed to create task!");
    }
};

// get current user's tasks controller
export async function getMyTasksController(req: Request, res: Response) {
    try {
        const { status, search, sortBy, sortOrder } = req.query;
        const options: GetTasksOptions = {};

        if (status !== undefined) {
            if (!isStatus(status))
                throw Error ("Invalid status!");

            options.status = status;
        }

        if (search !== undefined) {
            if (typeof search !== "string")
                throw Error ("Search must be a string!");

            options.search = search;
        }

        if (sortBy !== undefined) {
            if (!isTaskSortBy(sortBy))
                throw Error ("Invalid sort field!");

            options.sortBy = sortBy;
        }

        if (sortOrder !== undefined) {
            if (!isSortOrder(sortOrder))
                throw Error ("Invalid sort order!");

            options.sortOrder = sortOrder;
        }

        const tasks = await getTasksByUser(getUserId(req), options);

        res.status(200).json(tasks);
    }
    catch (error) {
        sendControllerError(res, error, "Failed to get tasks!");
    }
};

// get one task controller
export async function getTaskByIdController(req: Request, res: Response) {
    try {
        const task = await getTaskById(getUserId(req), getTaskId(req));

        res.status(200).json(task);
    }
    catch (error) {
        sendControllerError(res, error, "Failed to get task!");
    }
};

// update task controller
export async function updateTaskController(req: Request, res: Response) {
    try {
        const updates: UpdateTaskInput = {};
        const { title, description, status, priority, dueDate } = req.body;

        if (title !== undefined) {
            if (typeof title !== "string")
                throw Error ("Title must be a string!");

            updates.title = title;
        }

        if (description !== undefined) {
            if (description !== null && typeof description !== "string")
                throw Error ("Description must be a string!");

            updates.description = description;
        }

        if (status !== undefined) {
            if (!isStatus(status))
                throw Error ("Invalid status!");

            updates.status = status;
        }

        if (priority !== undefined) {
            if (!isPriority(priority))
                throw Error ("Invalid priority!");

            updates.priority = priority;
        }

        const parsedDueDate = toDate(dueDate, "due date");

        if (parsedDueDate !== undefined)
            updates.dueDate = parsedDueDate;

        const task = await updateTask(getUserId(req), getTaskId(req), updates);

        res.status(200).json(task);
    }
    catch (error) {
        sendControllerError(res, error, "Failed to update task!");
    }
};

// delete task controller
export async function deleteTaskController(req: Request, res: Response) {
    try {
        const task = await deleteTask(getUserId(req), getTaskId(req));

        res.status(200).json({ message: "Task deleted successfully!", task });
    }
    catch (error) {
        sendControllerError(res, error, "Failed to delete task!");
    }
};

// mark task completed controller
export async function markTaskCompletedController(req: Request, res: Response) {
    try {
        const task = await markTaskAsCompleted(getUserId(req), getTaskId(req));

        res.status(200).json(task);
    }
    catch (error) {
        sendControllerError(res, error, "Failed to complete task!");
    }
};
