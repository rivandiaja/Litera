import type { ResearchField } from "../types/field";
import type { ResearchProject } from "../types/project";

const FIELD_VISUALS = [
  { color: "text-indigo-700", bgColor: "bg-indigo-50", strip: "bg-indigo-500", badge: "indigo" as const },
  { color: "text-violet-700", bgColor: "bg-violet-50", strip: "bg-violet-500", badge: "lavender" as const },
  { color: "text-emerald-700", bgColor: "bg-emerald-50", strip: "bg-emerald-500", badge: "mint" as const },
  { color: "text-sky-700", bgColor: "bg-sky-50", strip: "bg-sky-500", badge: "sky" as const },
  { color: "text-orange-700", bgColor: "bg-orange-50", strip: "bg-orange-500", badge: "coral" as const },
  { color: "text-rose-700", bgColor: "bg-rose-50", strip: "bg-rose-500", badge: "rose" as const },
];

export function getInitials(name?: string) {
  if (!name) return "LT";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "LT";
}

export function getAvatarColor(id: number | string) {
  const colors = ["bg-indigo-500", "bg-emerald-500", "bg-violet-500", "bg-orange-500", "bg-sky-500", "bg-rose-500"];
  const numeric = typeof id === "number" ? id : id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return colors[Math.abs(numeric) % colors.length];
}

export function getFieldVisual(indexOrId: number | string = 0) {
  const numeric = typeof indexOrId === "number"
    ? indexOrId
    : indexOrId.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return FIELD_VISUALS[Math.abs(numeric) % FIELD_VISUALS.length];
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function adaptField(field: ResearchField, index = 0) {
  const visual = getFieldVisual(index);
  return {
    id: String(field.id),
    apiId: field.id,
    name: field.name,
    slug: field.slug,
    iconName: field.icon || "BookOpen",
    description: field.description,
    collectionCount: field.project_count,
    pdfCount: null,
    contributors: null,
    color: visual.color,
    bgColor: visual.bgColor,
    strip: visual.strip,
    badge: visual.badge,
    keywords: [] as string[],
    isActive: field.is_active,
    createdAt: field.created_at,
    updatedAt: field.updated_at,
  };
}

export type FieldDisplay = ReturnType<typeof adaptField>;

export function adaptProject(project: ResearchProject) {
  const visual = getFieldVisual(project.field.slug);
  return {
    id: String(project.id),
    apiId: project.id,
    title: project.title,
    fieldId: String(project.field.id),
    fieldApiId: project.field.id,
    fieldName: project.field.name,
    fieldSlug: project.field.slug,
    description: project.description,
    keywords: project.keywords,
    owner: {
      id: project.owner.id,
      name: project.owner.name,
      email: project.owner.email,
      nim: project.owner.student_number,
      initials: getInitials(project.owner.name),
      avatarColor: getAvatarColor(project.owner.id),
    },
    pdfCount: project.document_count,
    isPublic: project.visibility === "public",
    visibility: project.visibility,
    createdAt: formatDate(project.created_at),
    lastUpdated: formatDate(project.updated_at),
    strip: visual.strip,
    badge: visual.badge,
  };
}

export type ProjectDisplay = ReturnType<typeof adaptProject>;
