export function parseEmailTemplate(template: string, variables: Record<string, string>) {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\s*${key}\\s*\\}`, "g");
    result = result.replace(regex, value);
  }
  return result;
}
