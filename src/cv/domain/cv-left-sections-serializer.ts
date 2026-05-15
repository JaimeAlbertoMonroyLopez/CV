interface CvDomainLeftSectionsSerializerApi {
  isObjectRecord: (value: unknown) => value is Record<string, unknown>;
  safeJsonParse: (raw: string) => unknown | null;
  normalizePersistedLeftSections: (rawSections: readonly CvSectionModel[]) => CvSectionModel[];
  parseLeftSectionsFromDataset: (raw: string | null | undefined) => CvSectionModel[];
  stringifyLeftSections: (sections: readonly CvSectionModel[]) => string;
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function safeJsonParse(raw: string): unknown | null {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function makeFallbackLeftSectionId(seed: number): string {
  return `left-section-${Date.now().toString(36)}-${seed.toString(36)}`;
}

function normalizePersistedLeftSections(rawSections: readonly CvSectionModel[]): CvSectionModel[] {
  const normalized = rawSections
    .map((section, idx) => ({
      id: section.id || makeFallbackLeftSectionId(idx + 1),
      title: section.title.trim(),
      content: section.content,
      order: idx,
      side: "left" as const,
    }))
    .filter((section) => section.title.length > 0);
  return normalized;
}

function parseLeftSectionsFromDataset(raw: string | null | undefined): CvSectionModel[] {
  if (!raw) return [];
  const parsed = safeJsonParse(raw);
  if (!Array.isArray(parsed)) return [];
  const sections: CvSectionModel[] = [];
  parsed.forEach((item, idx) => {
    if (!isObjectRecord(item)) return;
    const titleValue = item.title;
    const contentValue = item.content;
    const idValue = item.id;
    if (typeof titleValue !== "string" || typeof contentValue !== "string") return;
    const id = typeof idValue === "string" && idValue.trim().length > 0 ? idValue : makeFallbackLeftSectionId(idx + 1);
    sections.push({
      id,
      title: titleValue.trim(),
      content: contentValue,
      order: sections.length,
      side: "left",
    });
  });
  return sections;
}

function stringifyLeftSections(sections: readonly CvSectionModel[]): string {
  return JSON.stringify(
    sections.map((section) => ({
      id: section.id,
      title: section.title,
      content: section.content,
      order: section.order,
      side: section.side,
    })),
  );
}

(window as unknown as { CvDomainLeftSectionsSerializer?: CvDomainLeftSectionsSerializerApi }).CvDomainLeftSectionsSerializer = {
  isObjectRecord,
  safeJsonParse,
  normalizePersistedLeftSections,
  parseLeftSectionsFromDataset,
  stringifyLeftSections,
};
