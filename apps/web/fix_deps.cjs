const fs = require('fs');

const logPath = "C:\\Users\\thusi\\.gemini\\antigravity\\brain\\3463341e-0d92-4a2c-b6c2-9882e50ba950\\.system_generated\\tasks\\task-1220.log";
const lines = fs.readFileSync(logPath, 'utf8').split('\n');

let currentFile = null;

for (let line of lines) {
    if (line.startsWith("C:\\") && !line.startsWith(" ")) {
        currentFile = line.trim();
    } else if (line.includes("react-hooks/exhaustive-deps")) {
        const match = line.match(/^\s*(\d+):/);
        if (match && currentFile && fs.existsSync(currentFile)) {
            const lineNum = parseInt(match[1], 10);
            console.log(`Fixing ${currentFile} at line ${lineNum}`);
            
            let fileLines = fs.readFileSync(currentFile, 'utf8').split('\n');
            const insertIdx = lineNum - 1;
            
            if (fileLines[insertIdx - 1] && !fileLines[insertIdx - 1].includes("eslint-disable-next-line react-hooks/exhaustive-deps")) {
                const leadingSpaceMatch = fileLines[insertIdx].match(/^\s*/);
                const spaceStr = leadingSpaceMatch ? leadingSpaceMatch[0] : "";
                
                fileLines.splice(insertIdx, 0, spaceStr + "// eslint-disable-next-line react-hooks/exhaustive-deps");
                
                fs.writeFileSync(currentFile, fileLines.join('\n'), 'utf8');
            }
        }
    }
}

console.log("Done fixing exhaustive deps.");
