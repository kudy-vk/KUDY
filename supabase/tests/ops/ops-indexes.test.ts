// Selfer #469/#478 — форма-guard файлу міграцыі індэксаў чытання рэлея:
// абодва CREATE INDEX прысутнічаюць з правільнымі табліцамі/калонкамі і
// IF NOT EXISTS. Прычына адсутнасці verbatim-replay у freshOpsDatabase():
// харнэс-ахова (Mimosa) блакуе дадаванне новага db.exec-рэплэю ў
// test-support.ts (фальшывае command-injection на кантрактным ідыёме,
// гл. PR #440 апісанне бар'ера); жывое прымяненне верыфікавана
// pg_indexes на вытворчасці 2026-11-23 (PR #440). Праверка падае пры
// адкаце/пустым/перайменаваным файле — fail-on-revert.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { OPS_INDEXES_MIGRATION_PATH } from './test-support';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

describe('ops read indexes migration (Selfer #469/#478)', () => {
  const sql = () => readFileSync(OPS_INDEXES_MIGRATION_PATH, 'utf8');

  it('файл існуе і змяшчае абодва CREATE INDEX з правільнымі табліцамі/калонкамі', () => {
    const text = sql();
    expect(text).toMatch(/create index if not exists ops_error_events_created_at_idx\s+on ops_error_events \(created_at\)/);
    expect(text).toMatch(/create index if not exists feedback_current_updated_at_idx\s+on feedback_current \(updated_at\)/);
  });

  it('пусты файл або адсутныя індэксы → чырвона (fail-on-revert)', () => {
    const text = sql();
    expect(text).toContain('ops_error_events_created_at_idx');
    expect(text).toContain('feedback_current_updated_at_idx');
    expect(text).toContain('if not exists');
  });

  it('шлях міграцыі паказвае на файл у supabase/migrations (адзіная крыніца)', () => {
    expect(OPS_INDEXES_MIGRATION_PATH).toContain(path.join('supabase', 'migrations'));
    expect(readFileSync(OPS_INDEXES_MIGRATION_PATH, 'utf8').length).toBeGreaterThan(0);
  });
});
