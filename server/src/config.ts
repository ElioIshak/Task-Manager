import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

for (const envPath of [resolve(process.cwd(), ".env"), resolve(process.cwd(), "..", ".env")]) {
    if (!existsSync(envPath))
        continue;

    const lines = readFileSync(envPath, "utf8").split(/\r?\n/);

    for (const line of lines) {
        const trimmedLine = line.trim();

        if (!trimmedLine || trimmedLine.startsWith("#"))
            continue;

        const separatorIndex = trimmedLine.indexOf("=");

        if (separatorIndex === -1)
            continue;

        const key = trimmedLine.slice(0, separatorIndex).trim();
        const value = trimmedLine.slice(separatorIndex + 1).trim();

        process.env[key] ??= value;
    }

    break;
}

export default {

    JWT_SECRET: process.env.JWT_SECRET ?? "SECRET",

    PORT: Number(process.env.PORT ?? 3000),

    CLIENT_ORIGIN: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",

};
