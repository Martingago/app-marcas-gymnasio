CREATE TABLE `ejercicio_categorias` (
	`ejercicio_id` integer NOT NULL,
	`categoria_id` integer NOT NULL,
	PRIMARY KEY(`ejercicio_id`, `categoria_id`),
	FOREIGN KEY (`ejercicio_id`) REFERENCES `ejercicios`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`categoria_id`) REFERENCES `categorias`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_ejercicios` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_ejercicios`("id", "nombre") SELECT "id", "nombre" FROM `ejercicios`;--> statement-breakpoint
DROP TABLE `ejercicios`;--> statement-breakpoint
ALTER TABLE `__new_ejercicios` RENAME TO `ejercicios`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
-- Sin REFERENCES: SQLite no lo permite en ADD COLUMN. Duplicados retirados (ya en 0003 y 0004).
ALTER TABLE `categorias` ADD `parent_id` integer;