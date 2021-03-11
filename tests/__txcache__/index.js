const fs = require('fs');
const path = require('path');

export const CACHE = {};

const cacheFiles = dir => {
    const dirFiles = fs.readdirSync(dir);
    dirFiles.forEach(file => {
        const filePath = path.resolve(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            cacheFiles(filePath);
        } else if (file.endsWith('.json')) {
            const rawJson = fs.readFileSync(filePath);
            const content = JSON.parse(rawJson);
            const key = file.substr(0, 6);
            if (CACHE[key]) {
                throw new Error(`tx cache duplicate: ${key}`);
            }
            CACHE[key] = {
                ...content,
                hash: file.split('.')[0],
            };
        }
    });
};

cacheFiles(path.resolve(__dirname));

export const TX_CACHE = hash => CACHE[hash];
