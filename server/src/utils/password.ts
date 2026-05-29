import bcrypt from "bcrypt";

// random data added to the password before hashimg
const SALT_ROUNDS = 10;

// password hashing
export const hashPassword = (plainPass: string) => {
    const hashedPass = bcrypt.hash(plainPass, SALT_ROUNDS);

    return hashedPass;
};


// password verification
export const verifyPassword = (plainPass: string, hashedPass: string) => {
    return bcrypt.compare(plainPass, hashedPass);
};
