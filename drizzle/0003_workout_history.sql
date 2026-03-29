-- SQLite no admite REFERENCES en ADD COLUMN; la FK queda solo en el esquema Drizzle / integridad lógica
ALTER TABLE `entrenamientos` ADD `rutina_id` integer;
--> statement-breakpoint
ALTER TABLE `series` ADD `serie_orden` integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
UPDATE entrenamientos SET rutina_id = (SELECT rutina_id FROM rutina_dias WHERE rutina_dias.id = entrenamientos.rutina_dia_id) WHERE rutina_dia_id IS NOT NULL;
