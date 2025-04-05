import { Kind, type TObject } from '@sinclair/typebox';
import type { Table } from 'drizzle-orm';
import {
  type BuildSchema,
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-typebox';

type Spread<
  T extends TObject | Table,
  Mode extends 'select' | 'insert' | 'update' | undefined,
> =
  T extends TObject<infer Fields>
    ? {
        [K in keyof Fields]: Fields[K];
      }
    : T extends Table
      ? Mode extends 'select'
        ? BuildSchema<'select', T['_']['columns'], undefined>['properties']
        : Mode extends 'insert'
          ? BuildSchema<'insert', T['_']['columns'], undefined>['properties']
          : Mode extends 'update'
            ? BuildSchema<'update', T['_']['columns'], undefined>['properties']
            : object
      : object;

/**
 * Spread a Drizzle schema into a plain object
 */
export const spread = <
  T extends TObject | Table,
  Mode extends 'select' | 'insert' | 'update' | undefined,
>(
  schema: T,
  mode?: Mode
): Spread<T, Mode> => {
  const newSchema: Record<string, unknown> = {};
  let table;
  switch (mode) {
    case 'insert':
    case 'select':
    case 'update':
      if (Kind in schema) {
        table = schema;
        break;
      }
      table =
        mode === 'insert'
          ? createInsertSchema(schema)
          : mode === 'select'
            ? createSelectSchema(schema)
            : createUpdateSchema(schema);
      break;
    default:
      if (!(Kind in schema)) throw new Error('Expect a schema');
      table = schema;
  }
  for (const key of Object.keys(table.properties))
    newSchema[key] = table.properties[key];
  return newSchema as Spread<T, Mode>;
};

/**
 * Spread a Drizzle Table into a plain object
 *
 * If `mode` is 'insert', the schema will be refined for insert
 * If `mode` is 'select', the schema will be refined for select
 * If `mode` is 'update', the schema will be refined for update
 * If `mode` is undefined, the schema will be spread as is, models will need to be refined manually
 */
export const spreads = <
  T extends Record<string, TObject | Table>,
  Mode extends 'select' | 'insert' | 'update' | undefined,
>(
  models: T,
  mode?: Mode
): {
  [K in keyof T]: Spread<T[K], Mode>;
} => {
  const newSchema: Record<string, unknown> = {};
  const keys = Object.keys(models);
  for (const key of keys) newSchema[key] = spread(models[key], mode);
  return newSchema as { [K in keyof T]: Spread<T[K], Mode> };
};
