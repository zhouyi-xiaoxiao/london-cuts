-- 0004_i18n_translations.sql
--
-- Adds additive bilingual content storage. English remains the canonical
-- legacy/base columns for backward compatibility; Simplified Chinese and
-- future locales live in jsonb translations objects keyed by locale
-- (`translations->'zh'`).

set search_path = public;

alter table projects
  add column if not exists translations jsonb not null default '{}'::jsonb;

alter table stops
  add column if not exists translations jsonb not null default '{}'::jsonb;

alter table postcards
  add column if not exists translations jsonb not null default '{}'::jsonb;

alter table assets
  add column if not exists translations jsonb not null default '{}'::jsonb;

comment on column projects.translations is
  'Locale-keyed public content translations. Base columns stay English for compatibility; e.g. translations.zh.title/subtitle/description/tags.';
comment on column stops.translations is
  'Locale-keyed stop translations. Use translations.zh.title/mood/display_label/body_blocks for Simplified Chinese.';
comment on column postcards.translations is
  'Locale-keyed postcard translations. Use translations.zh.message/recipient for Simplified Chinese.';
comment on column assets.translations is
  'Locale-keyed image alt/caption translations for public DTOs and markdown packs.';
