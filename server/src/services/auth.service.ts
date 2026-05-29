import { db } from '../db/db';
import { hashPassword, verifyPassword } from "../utils/password";
import type { Role, UserJWT } from "../types";
import { generateUserID } from "../utils/generators";
import config from "../config";

import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(config.JWT_SECRET);

// create token function
async function createToken(user: UserJWT) {
    return new SignJWT(user)
        .setProtectedHeader({alg: "HS256"})
        .setSubject(user.sub)
        .setIssuedAt()
        .setExpirationTime("30d")
        .sign(JWT_SECRET);
}

// normalize email function
function normalizeEmail(email: string) {
    return email.trim().toLowerCase().replaceAll(" ", "");
}

// role validation function
function isRole(role: string): role is Role {
    return role === "member" || role === "organization";
}

// signup function
export async function signup(
    email: string,
    firstName: string,
    lastName: string,
    password: string,
    confirmationPass: string,
    role: string,
    organizationId?: string
) {
    if (!email || !firstName || !lastName || !password || !confirmationPass)
        throw Error ("All fields must be filled !");

    if (password != confirmationPass)
        throw Error ("The passwords must match !");

    if (!isRole(role))
        throw Error ("Invalid role !");

    const normalizedEmail = normalizeEmail(email);
    const name = firstName + "_" + lastName;

    const userCount = await db
        .selectFrom("Users")
        .select((eb) => eb.fn.countAll().as("count"))
        .executeTakeFirst();

    const userId = generateUserID(Number(userCount?.count ?? 0) + 1);

    const hashedPassword = await hashPassword(password);

    const insertedUser = await db.transaction().execute(async (trx) => {
        const user = await trx
            .insertInto("Users")
            .values({
                id: userId,
                name,
                email: normalizedEmail,
                hashed_password: hashedPassword,
                role,
            })
            .returningAll()
            .executeTakeFirstOrThrow();
        
        if (role == "member") {
            await trx
                .insertInto("OrganizationMembers")
                .values({
                    user_id: userId,
                    organization_id: organizationId ?? null,
                })
                .execute();
        }

        if (role == "organization") {
            await trx
                .insertInto("Organizations")
                .values({
                    user_id: userId
                })
                .execute();
        }

        return user;
    });

    const token = await createToken({
        sub: userId,
        email: normalizedEmail,
        role: role
    });

    return {user: insertedUser, token: token};
};

// login function
export async function login(email: string, password: string) {
    if (!email || !password)
        throw Error ("An email and a password must be provided !");

    const normalizedEmail = normalizeEmail(email);

    const user = await db
        .selectFrom("Users")
        .selectAll()
        .where("email", "=", normalizedEmail)
        .executeTakeFirst()

    if (!user)
        throw Error ("Invalid Email!");

    const hashedPassword = user.hashed_password;

    const verified = await verifyPassword(password, String(hashedPassword));

    if (!verified)
        throw Error ("Incorrect Password!");

    const token = await createToken({
        sub: user.id,
        email: normalizedEmail,
        role: user.role
    });

    return {user: user, token: token};
};
