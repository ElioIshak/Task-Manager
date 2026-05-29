import { db } from "../db/db";
import type { Role } from "../types";
import { generateUserID } from "../utils/generators";
import { hashPassword, verifyPassword } from "../utils/password";

export type CreateUserInput = {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    confirmationPass: string;
    role: Role;
    organizationId?: string | null;
};

export type UpdateUserProfileInput = {
    name?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
};

// noramlize email function
function normalizeEmail(email: string) {
    return email.trim().toLowerCase().replaceAll(" ", "");
}

// build name function
function buildName(firstName: string, lastName: string) {
    return `${firstName.trim()}_${lastName.trim()}`;
}

// get user by id function
async function getPublicUserById(userId: string) {
    const user = await db
        .selectFrom("Users")
        .select(["id", "name", "email", "role", "is_valid", "created_at"])
        .where("id", "=", userId)
        .executeTakeFirst();

    if (!user)
        throw Error ("User not found!");

    return user;
}

// organization validation function
async function assertOrganizationExists(organizationId: string) {
    const organization = await db
        .selectFrom("Organizations")
        .select("user_id")
        .where("user_id", "=", organizationId)
        .executeTakeFirst();

    if (!organization)
        throw Error ("Organization not found!");
}

// get current user profile function
export async function getCurrentUserProfile(userId: string) {
    if (!userId)
        throw Error ("Invalid User!");

    const user = await getPublicUserById(userId);

    if (user.role !== "student")
        return { ...user, organization_id: null };

    const student = await db
        .selectFrom("Students")
        .select("organization_id")
        .where("user_id", "=", userId)
        .executeTakeFirst();

    return {
        ...user,
        organization_id: student?.organization_id ?? null
    };
}

// update profile function
export async function updateOwnProfile(userId: string, updates: UpdateUserProfileInput) {
    if (!userId)
        throw Error ("Invalid User!");

    const updateValues: {
        name?: string;
        email?: string;
        hashed_password?: string;
    } = {};

    if (updates.name !== undefined) {
        const normalizedName = updates.name.trim();

        if (!normalizedName)
            throw Error ("Name cannot be empty!");

        updateValues.name = normalizedName;
    }

    if (updates.email !== undefined) {
        const normalizedEmail = normalizeEmail(updates.email);

        if (!normalizedEmail)
            throw Error ("Email cannot be empty!");

        updateValues.email = normalizedEmail;
    }

    if (updates.newPassword !== undefined) {
        if (!updates.currentPassword)
            throw Error ("Current password is required!");

        const user = await db
            .selectFrom("Users")
            .select("hashed_password")
            .where("id", "=", userId)
            .executeTakeFirst();

        if (!user)
            throw Error ("User not found!");

        const isPasswordValid = await verifyPassword(updates.currentPassword, user.hashed_password);

        if (!isPasswordValid)
            throw Error ("Incorrect current password!");

        updateValues.hashed_password = await hashPassword(updates.newPassword);
    }

    if (Object.keys(updateValues).length === 0)
        throw Error ("No profile updates provided!");

    await db
        .updateTable("Users")
        .set(updateValues)
        .where("id", "=", userId)
        .executeTakeFirst();

    return getCurrentUserProfile(userId);
}

// delete account function
export async function deleteOwnAccount(userId: string) {
    if (!userId)
        throw Error ("Invalid User!");

    const user = await db
        .deleteFrom("Users")
        .where("id", "=", userId)
        .returning(["id", "name", "email", "role", "is_valid", "created_at"])
        .executeTakeFirst();

    if (!user)
        throw Error ("User not found!");

    return user;
}

// update company function
export async function updateUserCompany(userId: string, organizationId: string | null) {
    if (!userId)
        throw Error ("Invalid User!");

    const user = await db
        .selectFrom("Users")
        .select("role")
        .where("id", "=", userId)
        .executeTakeFirst();

    if (!user)
        throw Error ("User not found!");

    if (user.role !== "student")
        throw Error ("Only students can belong to a company!");

    if (organizationId)
        await assertOrganizationExists(organizationId);

    const student = await db
        .updateTable("Students")
        .set({ organization_id: organizationId })
        .where("user_id", "=", userId)
        .returningAll()
        .executeTakeFirst();

    if (!student)
        throw Error ("Student profile not found!");

    return getCurrentUserProfile(userId);
}
