import { z } from 'zod';
import { allowedFallbackFonts, allowedFontFormats } from '@temply/shared/theme';

export const DEFAULT_EDITOR_THEME_SCHEMA = z.object({
  font: z
    .object({
      fontFamily: z.string(),
      fallbackFontFamily: z.enum(allowedFallbackFonts as [string, ...string[]]),
      webFont: z
        .object({
          url: z.string(),
          format: z.enum(allowedFontFormats as [string, ...string[]]),
        })
        .optional(),
    })
    .optional()
    .nullable(),
  body: z
    .object({
      backgroundColor: z.string().optional(),
      paddingTop: z.string().optional(),
      paddingRight: z.string().optional(),
    })
    .optional()
    .nullable(),
  container: z
    .object({
      backgroundColor: z.string().optional(),
      paddingTop: z.string().optional(),
      paddingRight: z.string().optional(),
      borderRadius: z.string().optional(),
      borderWidth: z.string().optional(),
      borderColor: z.string().optional(),
      maxWidth: z.string().optional(),
    })
    .optional()
    .nullable(),
  button: z
    .object({
      backgroundColor: z.string().optional(),
      color: z.string().optional(),
      paddingTop: z.string().optional(),
      paddingRight: z.string().optional(),
      paddingBottom: z.string().optional(),
      paddingLeft: z.string().optional(),
      borderRadius: z.string().optional(),
    })
    .optional()
    .nullable(),
  link: z
    .object({
      color: z.string().optional(),
    })
    .optional()
    .nullable(),
});
