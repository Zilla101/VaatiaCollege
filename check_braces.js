const fs = require('fs');
const filePath = 'c:\\Users\\VCM SECRETARY\\Desktop\\VaatiaCollege\\admin\\scripts\\admin.js';

try {
    const content = fs.readFileSync(filePath, 'utf8');
    let stack = [];
    let lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        for (let j = 0; j < line.length; j++) {
            let char = line[j];
            if (char === '{') {
                stack.push({ char, line: i + 1, col: j + 1 });
            } else if (char === '}') {
                if (stack.length === 0) {
                    console.log(`Error: Unexpected '}' at line ${i + 1}, col ${j + 1}`);
                    return;
                }
                let last = stack.pop();
                // We're only tracking '{' vs '}' now to simplify logic, ignoring paren/bracket for now as mismatch reported was brace related
            }
            // Ignore ( ) [ ] for now to focus on block structure
        }
    }

    if (stack.length > 0) {
        console.log(`Error: Unclosed braces remain on stack:`);
        stack.forEach(s => console.log(`  Line ${s.line}, Col ${s.col}`));
    } else {
        console.log('Success: All braces are balanced.');
    }
} catch (err) {
    console.error('File read error:', err);
}
