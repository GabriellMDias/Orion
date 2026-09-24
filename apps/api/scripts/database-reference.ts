import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import pg from "pg";

type ColumnMeta = {
  description: string;
  classification: string;
  nullMeaning?: string;
  unit?: string;
};
type TableMeta = {
  owner: string;
  classification: string;
  description: string;
  lifecycle: string;
  columns: Record<string, ColumnMeta>;
  objects: Record<string, string>;
};
type Metadata = {
  tables: Record<string, TableMeta>;
  enums: Record<string, string>;
};
type Column = {
  table_name: string;
  column_name: string;
  physical_type: string;
  nullable: boolean;
  default_value: string | null;
};
type ObjectRow = { table_name: string; name: string; definition: string };
type EnumRow = { name: string; labels: string };
const metaPath = resolve(import.meta.dirname, "../prisma/schema-metadata.json");
function esc(value: string | null): string {
  return value === null
    ? "—"
    : value.replaceAll("|", "\\|").replaceAll("\n", " ");
}
function requireText(value: unknown, context: string): asserts value is string {
  if (typeof value !== "string" || value.trim() === "")
    throw new Error(`Missing schema documentation: ${context}`);
}
function requireClassification(value: unknown, context: string): void {
  if (
    !["PUBLIC", "INTERNAL", "CONFIDENTIAL", "RESTRICTED"].includes(
      String(value),
    )
  )
    throw new Error(`Invalid schema classification: ${context}`);
}
function exact(actual: string[], expected: string[], context: string) {
  if (actual.sort().join("\0") !== expected.sort().join("\0"))
    throw new Error(
      `Schema documentation mismatch at ${context}: database=[${actual.join(", ")}] metadata=[${expected.join(", ")}]`,
    );
}

export async function generateDatabaseReference(url: string): Promise<string> {
  const metadata = JSON.parse(await readFile(metaPath, "utf8")) as Metadata;
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    const columns = (
      await client.query<Column>(`
      SELECT c.relname AS table_name, a.attname AS column_name,
        format_type(a.atttypid, a.atttypmod) AS physical_type,
        NOT a.attnotnull AS nullable,
        pg_get_expr(d.adbin, d.adrelid) AS default_value
      FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      JOIN pg_attribute a ON a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped
      LEFT JOIN pg_attrdef d ON d.adrelid=c.oid AND d.adnum=a.attnum
      WHERE n.nspname='public' AND c.relkind='r' AND c.relname <> '_prisma_migrations'
      ORDER BY c.relname, a.attnum`)
    ).rows;
    const constraints = (
      await client.query<ObjectRow>(`
      SELECT c.relname AS table_name, x.conname AS name, pg_get_constraintdef(x.oid) AS definition
      FROM pg_constraint x JOIN pg_class c ON c.oid=x.conrelid
      JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relkind='r' AND c.relname <> '_prisma_migrations' AND x.contype <> 'p'
      ORDER BY c.relname,x.conname`)
    ).rows;
    const indexes = (
      await client.query<ObjectRow>(`
      SELECT tablename AS table_name,indexname AS name,indexdef AS definition
      FROM pg_indexes WHERE schemaname='public' AND tablename <> '_prisma_migrations' AND indexname NOT LIKE '%_pkey'
      ORDER BY tablename,indexname`)
    ).rows;
    const enums = (
      await client.query<EnumRow>(`
      SELECT t.typname AS name, string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) AS labels
      FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace JOIN pg_enum e ON e.enumtypid=t.oid
      WHERE n.nspname='public' GROUP BY t.typname ORDER BY t.typname`)
    ).rows;
    exact(
      [...new Set(columns.map((row) => row.table_name))],
      Object.keys(metadata.tables),
      "tables",
    );
    exact(
      enums.map((row) => row.name),
      Object.keys(metadata.enums),
      "enums",
    );
    const lines = [
      "# Approval Request Database Reference",
      "",
      "<!-- Generated from migrated PostgreSQL and apps/api/prisma/schema-metadata.json. Do not edit. -->",
      "",
      "[Schema documentation policy](../../database/schema-documentation.md) · [Approval Request specification](../../domains/approval-request.md)",
      "",
    ];
    for (const [tableName, tableMeta] of Object.entries(metadata.tables)) {
      requireText(tableMeta.owner, `${tableName}.owner`);
      requireText(tableMeta.description, `${tableName}.description`);
      requireText(tableMeta.lifecycle, `${tableName}.lifecycle`);
      requireText(tableMeta.classification, `${tableName}.classification`);
      requireClassification(
        tableMeta.classification,
        `${tableName}.classification`,
      );
      const fields = columns.filter((row) => row.table_name === tableName);
      exact(
        fields.map((row) => row.column_name),
        Object.keys(tableMeta.columns),
        `${tableName}.columns`,
      );
      const objects = [...constraints, ...indexes].filter(
        (row) => row.table_name === tableName,
      );
      exact(
        objects.map((row) => row.name),
        Object.keys(tableMeta.objects),
        `${tableName}.objects`,
      );
      lines.push(
        `## ${tableName}`,
        "",
        tableMeta.description,
        "",
        `Owner: ${tableMeta.owner}. Classification: ${tableMeta.classification}.`,
        "",
        `Lifecycle: ${tableMeta.lifecycle}`,
        "",
        "| Column | PostgreSQL type | Nullable | Default | Classification | Meaning | Null meaning | Unit |",
        "| --- | --- | --- | --- | --- | --- | --- | --- |",
      );
      for (const field of fields) {
        const meta = tableMeta.columns[field.column_name];
        requireText(
          meta.description,
          `${tableName}.${field.column_name}.description`,
        );
        requireText(
          meta.classification,
          `${tableName}.${field.column_name}.classification`,
        );
        requireClassification(
          meta.classification,
          `${tableName}.${field.column_name}.classification`,
        );
        if (field.nullable)
          requireText(
            meta.nullMeaning,
            `${tableName}.${field.column_name}.nullMeaning`,
          );
        lines.push(
          `| \`${field.column_name}\` | \`${esc(field.physical_type)}\` | ${field.nullable ? "yes" : "no"} | ${field.default_value ? `\`${esc(field.default_value)}\`` : "—"} | ${esc(meta.classification)} | ${esc(meta.description)} | ${esc(meta.nullMeaning ?? null)} | ${esc(meta.unit ?? null)} |`,
        );
      }
      lines.push(
        "",
        "### Constraints and indexes",
        "",
        "| Object | Physical definition | Purpose |",
        "| --- | --- | --- |",
      );
      for (const object of objects) {
        requireText(
          tableMeta.objects[object.name],
          `${tableName}.${object.name}.purpose`,
        );
        lines.push(
          `| \`${object.name}\` | \`${esc(object.definition)}\` | ${esc(tableMeta.objects[object.name])} |`,
        );
      }
      lines.push("");
    }
    if (enums.length) {
      lines.push(
        "## Database enums",
        "",
        "| Enum | Values | Meaning |",
        "| --- | --- | --- |",
      );
      for (const item of enums) {
        requireText(metadata.enums[item.name], `enum.${item.name}`);
        lines.push(
          `| \`${item.name}\` | ${esc(item.labels)} | ${esc(metadata.enums[item.name])} |`,
        );
      }
      lines.push("");
    }
    return lines.join("\n");
  } finally {
    await client.end();
  }
}
