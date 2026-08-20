-- Buscar IDs
SELECT 'URL:' as type, u.id, u.label FROM urls u WHERE u.label = 'tot' AND u.deleted_at IS NULL LIMIT 1;
SELECT 'GROUP:' as type, sg.id, sg.name FROM server_groups sg WHERE sg.name = 'GPS' AND sg.deleted_at IS NULL LIMIT 1;

-- Após descobrir os IDs, executar:
-- INSERT INTO resource_relationships (
--   source_type, source_id,
--   target_type, target_id,
--   relation_type,
--   organization_id,
--   metadata,
--   created_at,
--   updated_at
-- ) VALUES (
--   'url', '<URL_ID>',
--   'group', '<GROUP_ID>',
--   'depends_on',
--   (SELECT organization_id FROM urls WHERE id = '<URL_ID>'),
--   '{}',
--   NOW(),
--   NOW()
-- );
