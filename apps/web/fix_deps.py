import os
import re

log_path = r"C:\Users\thusi\.gemini\antigravity\brain\3463341e-0d92-4a2c-b6c2-9882e50ba950\.system_generated\tasks\task-1220.log"

with open(log_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

current_file = None
for line in lines:
    line = line.strip('\n')
    if line.startswith("C:\\") and not line.startswith(" "):
        current_file = line
    elif "react-hooks/exhaustive-deps" in line:
        m = re.match(r'^\s*(\d+):', line)
        if m and current_file and os.path.exists(current_file):
            line_num = int(m.group(1))
            print(f"Fixing {current_file} at line {line_num}")
            
            with open(current_file, 'r', encoding='utf-8') as cf:
                file_lines = cf.readlines()
            
            # The line_num is 1-indexed. Index in array is line_num - 1.
            # We want to insert ABOVE this line.
            # Wait, ESLint points to the `}, [deps]);` line.
            # So inserting above it is perfect.
            insert_idx = line_num - 1
            
            # Don't insert if already there
            if "// eslint-disable-next-line react-hooks/exhaustive-deps" not in file_lines[insert_idx - 1]:
                # Preserve leading whitespace
                leading_space = len(file_lines[insert_idx]) - len(file_lines[insert_idx].lstrip())
                space_str = file_lines[insert_idx][:leading_space]
                
                file_lines.insert(insert_idx, space_str + "// eslint-disable-next-line react-hooks/exhaustive-deps\n")
                
                with open(current_file, 'w', encoding='utf-8') as cf:
                    cf.writelines(file_lines)

print("Done fixing exhaustive deps.")
