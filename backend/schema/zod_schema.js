import zod from "zod";

import { RECORD_TYPES } from "../../frontend/src/config/constants.js";

const z = zod;

export const recordTypeEnum = z.enum(RECORD_TYPES);


const callNumberSuffixSchema = z.union([
  z.string().regex(/^[\d.]{1,5}([A-Z]| +R[\d])?$/, {
    error: "Call number suffix must be in format '123' or '123A' or '123 R1'",
  }),
  z.literal(""),
  z.null(),
])
  .nullable()
  .optional();

// --- Basic referenced schemas ---
const settingsSchema = z.object({
  archive_id: z.number(),
  settings: z.object({
    site_intro_text: z.string().default(""),
    featured_collection_id: z.string().nullable().optional(),
  }),
});

const archivesSchema = z.object({
  archive_id: z.number(),
  title: z.string(),
});

const list_itemsSchema = z.object({
  list_item_id: z.union([z.number(), z.literal("new")]),
  item: z.string().min(1),
  description: z.string().nullable().optional(),
  merge_target_id: z.number().nullable().optional(),
  record_type: recordTypeEnum.nullable().optional(),
});

const usersSchema = z.object({
  user_id: z.number().nullable().optional(),
  archive_id: z.number().nullable().optional(),
  username: z.string(),
  password: z
    .string()
    .min(8, { error: "Password must be at least 8 characters" })
    .regex(/[^A-Za-z0-9]/, { error: "Password must contain at least one special character" })
    .nullable()
    .optional(),
  firstname: z.string(),
  lastname: z.string().nullable().optional(),
  role: z.enum(["staff", "intern", "administrator"]),
  active: z.boolean().default(true),
  email: z.string().nullable().optional(),
  full_name: z.string().nullable().optional(),
});

const common_modification_fields = {
  date_created: z.iso.datetime().nullable().optional(),
  date_modified: z.iso.datetime().nullable().optional(),
  contributor_user_id: z.number().nullable().optional(),
  contributor_username: z.string().nullable().optional(),
  contributor_name: z.string().nullable().optional(),
  creator_user_id: z.number().nullable().optional(),
  creator_username: z.string().nullable().optional(),
  creator_name: z.string().nullable().optional(),
};

// --- Media ---
const mediaSchema = z.object({
  media_id: z.number().nullable().optional(),
  archive_id: z.number().nullable().optional(),
  record_id: z.number(),
  call_number_id: z.number().nullable().optional(),
  call_number_suffix: callNumberSuffixSchema,
  format_id: z.number().nullable().optional(),
  no_copies: z.number().min(1).nullable().optional().default(1).describe("Copies Count"),
  quality_id: z.number().nullable().optional(),
  generation_id: z.number().nullable().optional(),
  url: z
    .union([
      z.url({
        protocol: /^https?$/,
        hostname: z.regexes.domain,
        error: "Must be a valid URL",
      }),
      z.literal(""),
      z.null(),
    ])
    .nullable()
    .optional(),
  // url: z.string().url().nullable(),
  thumbnail: z.string().nullable().optional(),
  call_number_item: list_itemsSchema.nullable().optional().describe("Call Number"),
  generation_item: list_itemsSchema.nullable().optional().describe("Generation"),
  format_item: list_itemsSchema.describe("Format"),
  quality_item: list_itemsSchema.nullable().optional().describe("Quality"),
  original_doc_id: z.number().nullable().optional(),
  is_primary: z.boolean(),
  ...common_modification_fields,
});

// --- Record ---
const recordsSchema = z.object({
  record_id: z.number().nullable().optional(),
  archive_id: z.number().nullable().optional(),
  title: z.string().min(1).default(""),
  description: z.string().min(1).default(""),
  notes: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  vol_number: z.string().describe("Volume Number").nullable().optional(),
  collection_id: z.number().nullable().optional(),
  parent_record_id: z.number().nullable().optional(),
  primary_media_id: z.number().optional(),
  year: z.number().nullable().optional(),
  month: z.number().nullable().optional(),
  day: z.number().nullable().optional(),
  program_id: z.number().nullable().optional(),
  needs_review: z.boolean().default(false),
  is_hidden: z.boolean().default(false),
  fact_number: z
    .union([
      z.string().regex(/^FACT_[0-9]{4,6}_[A-Z0-9_]+$/, { error: "Fact number must be in format 'FACT_XXXX_XXXX'" }),
      z.literal(""),
      z.null(),
    ])
    .describe("Cloud Backup Reference ID (FACT)")
    .nullable()
    .optional(),
  date_string: z
    .union([z.string().regex(/\d{2}\/\d{2}\/\d{4}/), z.literal("MM/DD/YYYY"), z.null()])
    .nullable()
    .optional()
    .superRefine((val, ctx) => {
      if (!val || val === "" || val === "MM/DD/YYYY") return; // Allow empty/null
      const parts = val.split("/");
      if (parts.length !== 3) {
        ctx.addIssue({
          code: "custom",
          error: "Date must be in MM/DD/YYYY format",
        });
        return;
      }

      const [month, day, year] = parts.map(Number);

      // Validate month
      if (month !== 0 && (month < 1 || month > 12)) {
        ctx.addIssue({
          code: "custom",
          error: "Month must be 00 (unknown) or 01-12",
        });
      }

      // Validate day
      if (day !== 0 && (day < 1 || day > 31)) {
        ctx.addIssue({
          code: "custom",
          error: "Day must be 00 (unknown) or 01-31",
        });
      }

      // Validate year
      if (year != 0 && (year < 1920 || year > 2100)) {
        ctx.addIssue({
          code: "custom",
          error: "Year must be between 1920 and 2100",
        });
      }
    })
    .describe("Date"),
  year_is_circa: z.boolean().default(false).describe("Approximate Date"),
  program: list_itemsSchema.nullable().optional(),
  media: z.array(mediaSchema).describe("Media").min(1),
  has_digital: z.boolean().default(false),
  authors: z.array(list_itemsSchema).nullable().optional(),
  subjects: z.array(list_itemsSchema).nullable().optional(),
  keywords: z.array(list_itemsSchema).nullable().optional(),
  producers: z.array(list_itemsSchema).nullable().optional(),
  publishers: z.array(list_itemsSchema).nullable().optional(),
  primary_media_thumbnail: z.string().nullable().optional(),
  primary_media_format_id: z.number().nullable().optional(),
  primary_media_format_text: z.string().nullable().optional(),
  record_type: recordTypeEnum.nullable().optional(),
  collection: z.lazy(() => embeddedCollectionSchema),
  children: z
    .array(z.lazy(() => embeddedRecordSchema))
    .nullable()
    .optional(),
  siblings: z
    .array(z.lazy(() => embeddedRecordSchema))
    .nullable()
    .optional(),
  parent: z
    .lazy(() => embeddedRecordSchema)
    .nullable()
    .optional(),
  continuations: z
    .array(z.lazy(() => embeddedRecordSchema))
    .nullable()
    .optional(),
  ...common_modification_fields,
});
//   .superRefine((data, ctx) => {
//     const primaryCount = data.media.filter((i) => i.is_primary).length;
//     if (primaryCount !== 1) {
//       ctx.addIssue({
//         code: z.ZodIssueCode.custom,
//         error: `Exactly one media must be marked as primary`,
//         path: ["media"],
//       });
//     }
//   });

// --- Data Schemas ---
const recordItemSchema = recordsSchema.pick({
  record_id: true,
  title: true,
});

const embeddedRecordItemSchema = recordItemSchema.extend({ delete: z.boolean().optional() });

const mediaDataSchema = mediaSchema
  .pick({
    media_id: true,
    call_number_item: true,
    call_number_suffix: true,
    generation_item: true,
    format_item: true,
    quality_item: true,
    no_copies: true,
    url: true,
  })
  .extend({ delete: z.boolean().optional() })
  .refine(
    (data) => {
      return !data.call_number_item || data.call_number_suffix;
    },
    {
      error: "Required if call number class is provided",
      path: ["call_number_suffix"],
    },
  );

const recordsDataSchema = recordsSchema
  .pick({
    record_id: true,
    title: true,
    description: true,
    is_hidden: true,
    needs_review: true,
    authors: true,
    producers: true,
    keywords: true,
    subjects: true,
    vol_number: true,
    program: true,
    publishers: true,
    location: true,
    date_string: true,
    year_is_circa: true,
    notes: true,
    primary_media_id: true,
    fact_number: true,
  })
  .extend({
    parent: recordItemSchema.nullable().optional().describe('Parent Record'),
    children: z
      .array(recordItemSchema.extend({ delete: z.boolean().optional() }))
      .describe('Child Records')
      .nullable()
      .optional(),
    continuations: z.array(recordItemSchema).nullable().optional(),
    collection: z.lazy(() => collectionItemSchema),
    media: z.array(mediaDataSchema).describe('Media').min(1, { error: "At least one media item is required" }),
    // .default([mediaDataSchema.parse({})]),
  });

const embeddedRecordSchema = recordsSchema
  .pick({
    record_id: true,
    title: true,
    is_hidden: true,
    parent_record_id: true,
    primary_media_thumbnail: true,
    primary_media_format_id: true,
    primary_media_format_text: true,
    record_type: true,
    collection: z.lazy(() => embeddedCollectionSchema),
  })
  .extend({ record_id: z.number(), delete: z.boolean().optional() });

const collectionsSchema = z.object({
  collection_id: z.number().nullable().optional(),
  archive_id: z.number().nullable().optional(),
  parent_collection_id: z.number().nullable().optional(),
  title: z.string().min(1),
  description: z.string().min(1).default(""),
  summary: z.string().nullable().optional(),
  call_number_id: z.number().nullable().optional(),
  call_number_suffix: callNumberSuffixSchema,
  notes: z.string().nullable().optional(),
  thumbnail: z.string().nullable().optional(),
  display_order: z.number().nullable().optional(),
  needs_review: z.boolean().default(false),
  is_hidden: z.boolean().default(false),
  call_number_item: list_itemsSchema.nullable().optional().describe("Call Number"),
  subjects: z.array(list_itemsSchema).nullable().optional(),
  keywords: z.array(list_itemsSchema).nullable().optional(),
  publishers: z.array(list_itemsSchema).nullable().optional(),
  child_records: z.array(embeddedRecordSchema),
  featured_records: z.array(embeddedRecordSchema),
  parent: z.lazy(() => embeddedCollectionSchema),
  children: z.array(z.lazy(() => embeddedCollectionSchema)),
  ...common_modification_fields,
});

const embeddedCollectionSchema = collectionsSchema.pick({
  collection_id: true,
  title: true,
  call_number_id: true,
  thumbnail: true,
  display_order: true,
  is_hidden: true,
  summary: true,
  //   parent: collectionItemSchema.nullable().optional(),
});

const collectionItemSchema = collectionsSchema.pick({
  collection_id: true,
  title: true,
});

const embeddedCollectionItemSchema = collectionItemSchema.extend({ delete: z.boolean().optional() });

const collectionsDataSchema = collectionsSchema
  .pick({
    title: true,
    description: true,
    summary: true,
    call_number_suffix: true,
    call_number_item: true,
    notes: true,
    thumbnail: true,
    display_order: true,
    needs_review: true,
    is_hidden: true,
    creator_username: true,
    publishers: true,
    subjects: true,
    keywords: true,
  })
  .extend({
    child_records: z.array(embeddedRecordItemSchema).nullable().optional(),
    parent: embeddedCollectionItemSchema.nullable().optional().describe('Parent Collection'),
    children: z.array(embeddedCollectionItemSchema).nullable().optional().describe('Child Collections'),
    featured_records: z.array(embeddedRecordItemSchema).nullable().optional(),
  });

// console.log('SCHEMA!', getDefaults(recordsDataSchema));
// console.log('SCHEMA!', mediaDataSchema.safeParse({}));

export default {
  archivesSchema,
  list_itemsSchema,
  list_itemsDataSchema: list_itemsSchema,
  usersSchema,
  usersDataSchema: usersSchema,
  recordsSchema,
  recordsDataSchema,
  mediaSchema,
  mediaDataSchema,
  collectionsSchema,
  collectionsDataSchema,
  settingsSchema,
  settingsDataSchema: settingsSchema,
};
