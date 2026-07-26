-- Renombra el permiso Freepik a Magnific y conserva las asignaciones de roles.
UPDATE `Permission`
SET
  `key` = 'magnific:access',
  `module` = 'magnific',
  `label` = 'Acceder a Magnific'
WHERE `key` = 'freepik:access';
