export type HttpVerb = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface LinkDef {
  href: string;
  method: HttpVerb;
}

export type LinksMap = Record<string, LinkDef | null>;
