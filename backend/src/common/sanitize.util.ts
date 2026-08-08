import sanitizeHtml from 'sanitize-html';

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [],
  allowedAttributes: {},
  disallowedTagsMode: 'discard',
  allowedSchemes: [],
  allowedSchemesByTag: {},
  allowedSchemesAppliedToAttributes: [],
  allowProtocolRelative: false,
  enforceHtmlBoundary: true,
};

export function sanitizeInput(input: string): string {
  return sanitizeHtml(input, SANITIZE_OPTIONS).trim();
}

export function sanitizeObject<T extends Record<string, any>>(obj: T, fields: (keyof T)[]): T {
  const result = { ...obj };
  for (const field of fields) {
    const val = result[field];
    if (typeof val === 'string') {
      result[field] = sanitizeInput(val) as any;
    }
  }
  return result;
}
