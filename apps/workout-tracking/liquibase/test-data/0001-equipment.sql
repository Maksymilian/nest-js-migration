--liquibase formatted sql

--changeset workout-tracking:test-data-0001-equipment context:test-data
--comment: Equipment for local testing and the Postman collection. Ada's bike and Grace's treadmill are paired; the rower isn't.
INSERT INTO equipment (id, serial_number, type, paired_member_id, paired_at, registered_at, version) VALUES
  ('0199c3a2-0000-7000-8000-000000000001', 'BK-0001', 'BIKE', 'ada@example.com', '2026-10-01T08:00:00Z', '2026-10-01T07:00:00Z', 2),
  ('0199c3a2-0000-7000-8000-000000000002', 'TM-0001', 'TREADMILL', 'grace@example.com', '2026-10-01T08:00:00Z', '2026-10-01T07:00:00Z', 2),
  ('0199c3a2-0000-7000-8000-000000000003', 'RW-0001', 'ROWER', NULL, NULL, '2026-10-01T07:00:00Z', 1);
--rollback DELETE FROM equipment WHERE id IN ('0199c3a2-0000-7000-8000-000000000001', '0199c3a2-0000-7000-8000-000000000002', '0199c3a2-0000-7000-8000-000000000003');
