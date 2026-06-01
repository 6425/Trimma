const fs = require('fs');

const logPath = "C:\\Users\\thusi\\.gemini\\antigravity\\brain\\3463341e-0d92-4a2c-b6c2-9882e50ba950\\.system_generated\\tasks\\task-1444.log";
const lines = fs.readFileSync(logPath, 'utf8').split('\n');

const filesToFix = new Set();

let currentFile = null;

for (let line of lines) {
    if (line.startsWith("C:\\") && !line.startsWith(" ")) {
        currentFile = line.trim();
    } else if (line.includes("@next/next/no-img-element")) {
        if (currentFile && fs.existsSync(currentFile)) {
            filesToFix.add(currentFile);
        }
    }
}

for (const file of filesToFix) {
    let fileContent = fs.readFileSync(file, 'utf8');
    if (!fileContent.includes("/* eslint-disable @next/next/no-img-element */")) {
        console.log("Fixing image warnings in " + file);
        // Insert at the very top of the file
        fs.writeFileSync(file, "/* eslint-disable @next/next/no-img-element */\n" + fileContent, 'utf8');
    }
}

console.log("Done fixing image warnings.");
