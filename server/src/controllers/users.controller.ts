import type { Request, Response } from "express";
import type { Role } from "../types";
import {
    createUser,
    deleteOwnAccount,
    getCurrentUserProfile,
    updateOwnProfile,
    updateUserCompany,
    type CreateUserInput,
    type UpdateUserProfileInput
} from "../services/users.service";

function isRole(role: unknown): role is Role {
    return role === "student" || role === "organization";
}

function getUserId(req: Request) {
    return req.userJWT?.sub ?? "";
}

function sendControllerError(res: Response, error: unknown, fallback: string) {
    const message = error instanceof Error ? error.message : fallback;
    const status = message.toLowerCase().includes("not found") ? 404 : 400;

    res.status(status).json({ message });
}

// create user controller
export async function createUserController(req: Request, res: Response) {
    try {
        const {
            email,
            firstName,
            lastName,
            password,
            confirmationPass,
            role,
            organizationId
        } = req.body;

        if (!isRole(role))
            throw Error ("Invalid role!");

        const input: CreateUserInput = {
            email,
            firstName,
            lastName,
            password,
            confirmationPass,
            role,
            organizationId
        };

        const user = await createUser(input);

        res.status(201).json(user);
    }
    catch (error) {
        sendControllerError(res, error, "Failed to create user!");
    }
};

// get current user profile controller
export async function getCurrentUserProfileController(req: Request, res: Response) {
    try {
        const user = await getCurrentUserProfile(getUserId(req));

        res.status(200).json(user);
    }
    catch (error) {
        sendControllerError(res, error, "Failed to get user profile!");
    }
};

// update own profile controller
export async function updateOwnProfileController(req: Request, res: Response) {
    try {
        const { name, email, currentPassword, newPassword } = req.body;
        const updates: UpdateUserProfileInput = {};

        if (name !== undefined) {
            if (typeof name !== "string")
                throw Error ("Name must be a string!");

            updates.name = name;
        }

        if (email !== undefined) {
            if (typeof email !== "string")
                throw Error ("Email must be a string!");

            updates.email = email;
        }

        if (currentPassword !== undefined) {
            if (typeof currentPassword !== "string")
                throw Error ("Current password must be a string!");

            updates.currentPassword = currentPassword;
        }

        if (newPassword !== undefined) {
            if (typeof newPassword !== "string")
                throw Error ("New password must be a string!");

            updates.newPassword = newPassword;
        }

        const user = await updateOwnProfile(getUserId(req), updates);

        res.status(200).json(user);
    }
    catch (error) {
        sendControllerError(res, error, "Failed to update profile!");
    }
};

// delete own account controller
export async function deleteOwnAccountController(req: Request, res: Response) {
    try {
        const user = await deleteOwnAccount(getUserId(req));

        res.status(200).json({ message: "Account deleted successfully!", user });
    }
    catch (error) {
        sendControllerError(res, error, "Failed to delete account!");
    }
};

// update user company controller
export async function updateUserCompanyController(req: Request, res: Response) {
    try {
        const { organizationId } = req.body;

        if (organizationId !== null && organizationId !== undefined && typeof organizationId !== "string")
            throw Error ("Organization id must be a string!");

        const user = await updateUserCompany(getUserId(req), organizationId ?? null);

        res.status(200).json(user);
    }
    catch (error) {
        sendControllerError(res, error, "Failed to update company!");
    }
};
