-- #469/#478 (Selfer telegram-ops follow-ups) — індэксы пад сканы рэлея:
-- worker (factory/telegram-ops/, Selfer) чытае ops_error_events і
-- feedback_current па created_at/updated_at на кожны polling-цыкл
-- (2-window-агрэгаты S3/S4 + дайджэст/трыгер ≤2★). T-K1 міграцыя стварыла
-- ops_error_events без PK/індэкса (append-лог), G16.01 — feedback_current
-- з PK (device,target…) індэкс якога не абслугоўвае updated_at-сканы.
-- Афіцыйна прыменена на жывой БД праз адмін-MCP 2026-11-23 (0 радкоў на
-- момант стварэння, ідэмпатэнтна; гл. #469/#478 evidence).
--
-- IF NOT EXISTS: файл — адзіная крыніца для чыстых асяроддзяў, жывое
-- прымяненне было раней — другі прагон не дублюе.

create index if not exists ops_error_events_created_at_idx
  on ops_error_events (created_at);

create index if not exists feedback_current_updated_at_idx
  on feedback_current (updated_at);
