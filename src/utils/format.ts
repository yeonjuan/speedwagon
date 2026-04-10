export const format = {
  stringLiteral: (value: string | number) => {
    return `"${value}"`;
  },
  template: (template: string, data: Record<string, unknown> = {}) => {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
      String(data[key] ?? ""),
    );
  },
};
