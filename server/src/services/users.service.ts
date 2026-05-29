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

// create user function
export async function createUser(input: CreateUserInput) {
    if (!input.email || !input.firstName || !input.lastName || !input.password || !input.confirmationPass)
        throw Error ("All fields must be filled!");

    if (input.password !== input.confirmationPass)
        throw Error ("The passwords must match!");

    if (input.role === "member" && input.organizationId)
        await assertOrganizationExists(input.organizationId);

    const normalizedEmail = normalizeEmail(input.email);
    const name = buildName(input.firstName, input.lastName);

    const userCount = await db
        .selectFrom("Users")
        .select((eb) => eb.fn.countAll().as("count"))
        .executeTakeFirst();

    const userId = generateUserID(Number(userCount?.count ?? 0) + 1);
    const hashedPassword = await hashPassword(input.password);

    await db.transaction().execute(async (trx) => {
        await trx
            .insertInto("Users")
            .values({
                id: userId,
                name,
                email: normalizedEmail,
                hashed_password: hashedPassword,
                role: input.role
            })
            .executeTakeFirstOrThrow();

        if (input.role === "member") {
            await trx
                .insertInto("OrganizationMembers")
                .values({
                    user_id: userId,
                    organization_id: input.organizationId ?? null
                })
                .execute();
        }

        if (input.role === "organization") {
            await trx
                .insertInto("Organizations")
                .values({ user_id: userId })
                .execute();
        }
    });

    return getCurrentUserProfile(userId);
}

// get current user profile function
export async function getCurrentUserProfile(userId: string) {
    if (!userId)
        throw Error ("Invalid User!");

    const user = await getPublicUserById(userId);

    if (user.role !== "member")
        return { ...user, organization_id: null };

    const member = await db
        .selectFrom("OrganizationMembers")
        .select("organization_id")
        .where("user_id", "=", userId)
        .executeTakeFirst();

    return {
        ...user,
        organization_id: member?.organization_id ?? null
    };
}

// list organization function
export async function listOrganizations() {
    return db
        .selectFrom("Organizations")
        .innerJoin("Users", "Users.id", "Organizations.user_id")
        .select([
            "Organizations.user_id as id",
            "Users.name as name"
        ])
        .orderBy("Users.name", "asc")
        .execute();
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

// update organization function
export async function updateUserOrganization(userId: string, organizationId: string | null) {
    if (!userId)
        throw Error ("Invalid User!");

    const user = await db
        .selectFrom("Users")
        .select("role")
        .where("id", "=", userId)
        .executeTakeFirst();

    if (!user)
        throw Error ("User not found!");

    if (user.role !== "member")
        throw Error ("Only members can belong to an organization!");

    if (organizationId)
        await assertOrganizationExists(organizationId);

    const member = await db
        .updateTable("OrganizationMembers")
        .set({ organization_id: organizationId })
        .where("user_id", "=", userId)
        .returningAll()
        .executeTakeFirst();

    if (!member)
        throw Error ("Organization member profile not found!");

    return getCurrentUserProfile(userId);
}
