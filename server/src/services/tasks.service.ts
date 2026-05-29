import { db } from "../db/db";
import type { Priority, Status } from "../types";
import { generateTaskID } from "../utils/generators";

type TaskSortBy = "created_at" | "due_date";
type SortOrder = "asc" | "desc";

export type GetTasksOptions = {
    status?: Status;
    search?: string;
    sortBy?: TaskSortBy;
    sortOrder?: SortOrder;
};

export type UpdateTaskInput = {
    title?: string;
    description?: string | null;
    status?: Status;
    priority?: Priority;
    dueDate?: Date;
};

// get user role function
async function getUserRole(userId: string) {
    const user = await db
        .selectFrom("Users")
        .select("role")
        .where("id", "=", userId)
        .executeTakeFirst();

    if (!user)
        throw Error ("User not found!");

    return user.role;
}

// get 
async function getMemberOrganizationId(userId: string) {
    const member = await db
        .selectFrom("OrganizationMembers")
        .select("organization_id")
        .where("user_id", "=", userId)
        .executeTakeFirst();

    if (!member)
        throw Error ("Organization member profile not found!");

    if (!member.organization_id)
        throw Error ("Member is not assigned to an organization!");

    return member.organization_id;
}

// create task function
export async function createTask(
    userId: string,
    title: string,
    description: string | null,
    status: Status,
    priority: Priority,
    dueDate: Date,
    createdAt: Date
) {
    if (!userId)
        throw Error ("Invalid User!")

    const taskCount = await db
        .selectFrom("Tasks")
        .select((eb) => eb.fn.countAll().as("count"))
        .executeTakeFirst();

    const taskId = generateTaskID(userId, Number(taskCount?.count ?? 0) + 1)
    const normalizedTitle = title.trim() || ("Task_" + taskId);

    const task = await db
        .insertInto("Tasks")
        .values({
            id: taskId,
            user_id: userId,
            organization_id: null,
            assigned_to: null,
            title: normalizedTitle,
            description: description,
            status: status,
            priority: priority,
            due_date: dueDate,
            created_at: createdAt
        })
        .returningAll()
        .executeTakeFirstOrThrow();

    if (!task)
        throw Error ("Failed to create task!")

    return task;
};

// create organization task function
export async function createOrganizationTask(
    organizationId: string,
    title: string,
    description: string | null,
    status: Status,
    priority: Priority,
    dueDate: Date,
    createdAt: Date
) {
    if (!organizationId)
        throw Error ("Invalid Organization!");

    const role = await getUserRole(organizationId);

    if (role !== "organization")
        throw Error ("Only organizations can post organization tasks!");

    const taskCount = await db
        .selectFrom("Tasks")
        .select((eb) => eb.fn.countAll().as("count"))
        .where("organization_id", "=", organizationId)
        .executeTakeFirst();

    const taskId = generateTaskID(organizationId, Number(taskCount?.count ?? 0) + 1);
    const normalizedTitle = title.trim() || ("Task_" + taskId);

    const task = await db
        .insertInto("Tasks")
        .values({
            id: taskId,
            user_id: organizationId,
            organization_id: organizationId,
            assigned_to: null,
            title: normalizedTitle,
            description,
            status,
            priority,
            due_date: dueDate,
            created_at: createdAt
        })
        .returningAll()
        .executeTakeFirstOrThrow();

    return task;
};

// get user tasks function (with options)
export async function getTasksByUser(userId: string, options: GetTasksOptions = {}) {
    if (!userId)
        throw Error ("Invalid User!");

    const sortBy = options.sortBy ?? "created_at";
    const sortOrder = options.sortOrder ?? "desc";

    let query = db
        .selectFrom("Tasks")
        .selectAll()
        .where("user_id", "=", userId);

    if (options.status) {
        query = query.where("status", "=", options.status);
    }

    const search = options.search?.trim();

    if (search) {
        query = query.where("title", "ilike", `%${search}%`);
    }

    return query
        .orderBy(sortBy, sortOrder)
        .execute();
};

// get tasks for the user's organization function
export async function getOrganizationTasksForUser(userId: string, options: GetTasksOptions = {}) {
    if (!userId)
        throw Error ("Invalid User!");

    const role = await getUserRole(userId);
    const organizationId = role === "organization"
        ? userId
        : await getMemberOrganizationId(userId);

    const sortBy = options.sortBy ?? "created_at";
    const sortOrder = options.sortOrder ?? "desc";

    let query = db
        .selectFrom("Tasks")
        .selectAll()
        .where("organization_id", "=", organizationId);

    if (options.status)
        query = query.where("status", "=", options.status);

    const search = options.search?.trim();

    if (search)
        query = query.where("title", "ilike", `%${search}%`);

    return query
        .orderBy(sortBy, sortOrder)
        .execute();
};

// get available organization tasks function
export async function getAvailableOrganizationTasks(userId: string, options: GetTasksOptions = {}) {
    if (!userId)
        throw Error ("Invalid User!");

    const organizationId = await getMemberOrganizationId(userId);
    const sortBy = options.sortBy ?? "created_at";
    const sortOrder = options.sortOrder ?? "desc";

    let query = db
        .selectFrom("Tasks")
        .selectAll()
        .where("organization_id", "=", organizationId)
        .where("assigned_to", "is", null);

    if (options.status)
        query = query.where("status", "=", options.status);

    const search = options.search?.trim();

    if (search)
        query = query.where("title", "ilike", `%${search}%`);

    return query
        .orderBy(sortBy, sortOrder)
        .execute();
};

// take organization task function
export async function takeOrganizationTask(userId: string, taskId: string) {
    if (!userId)
        throw Error ("Invalid User!");

    if (!taskId)
        throw Error ("Invalid Task!");

    const organizationId = await getMemberOrganizationId(userId);

    const task = await db
        .updateTable("Tasks")
        .set({
            assigned_to: userId,
            status: "IN_PROGRESS"
        })
        .where("id", "=", taskId)
        .where("organization_id", "=", organizationId)
        .where("assigned_to", "is", null)
        .returningAll()
        .executeTakeFirst();

    if (!task)
        throw Error ("Task not found or already assigned!");

    return task;
};

// get task by id function
export async function getTaskById(userId: string, taskId: string) {
    if (!userId)
        throw Error ("Invalid User!");

    if (!taskId)
        throw Error ("Invalid Task!");

    const task = await db
        .selectFrom("Tasks")
        .selectAll()
        .where("id", "=", taskId)
        .where("user_id", "=", userId)
        .executeTakeFirst();

    if (!task)
        throw Error ("Task not found!");

    return task;
};

// update task function
export async function updateTask(userId: string, taskId: string, updates: UpdateTaskInput) {
    if (!userId)
        throw Error ("Invalid User!");

    if (!taskId)
        throw Error ("Invalid Task!");

    const updateValues: {
        title?: string;
        description?: string | null;
        status?: Status;
        priority?: Priority;
        due_date?: Date;
    } = {};

    if (updates.title !== undefined) {
        const normalizedTitle = updates.title.trim();

        if (!normalizedTitle)
            throw Error ("Title cannot be empty!");

        updateValues.title = normalizedTitle;
    }

    if (updates.description !== undefined)
        updateValues.description = updates.description;

    if (updates.status !== undefined)
        updateValues.status = updates.status;

    if (updates.priority !== undefined)
        updateValues.priority = updates.priority;

    if (updates.dueDate !== undefined)
        updateValues.due_date = updates.dueDate;

    if (Object.keys(updateValues).length === 0)
        throw Error ("No task updates provided!");

    const task = await db
        .updateTable("Tasks")
        .set(updateValues)
        .where("id", "=", taskId)
        .where("user_id", "=", userId)
        .returningAll()
        .executeTakeFirst();

    if (!task)
        throw Error ("Task not found!");

    return task;
};

// delete task function
export async function deleteTask(userId: string, taskId: string) {
    if (!userId)
        throw Error ("Invalid User!");

    if (!taskId)
        throw Error ("Invalid Task!");

    const task = await db
        .deleteFrom("Tasks")
        .where("id", "=", taskId)
        .where("user_id", "=", userId)
        .returningAll()
        .executeTakeFirst();

    if (!task)
        throw Error ("Task not found!");

    return task;
};

// mark completed function
export async function markTaskAsCompleted(userId: string, taskId: string) {
    if (!userId)
        throw Error ("Invalid User!");

    if (!taskId)
        throw Error ("Invalid Task!");

    const task = await db
        .updateTable("Tasks")
        .set({ status: "COMPLETED" })
        .where("id", "=", taskId)
        .where((eb) => eb.or([
            eb("user_id", "=", userId),
            eb("assigned_to", "=", userId)
        ]))
        .returningAll()
        .executeTakeFirst();

    if (!task)
        throw Error ("Task not found!");

    return task;
};
