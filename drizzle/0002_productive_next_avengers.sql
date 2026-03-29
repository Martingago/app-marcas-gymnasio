CREATE TABLE `rutina_dia_ejercicio_series` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`rutina_dia_ejercicio_id` integer,
	`serie_orden` integer NOT NULL,
	`reps_objetivo` text DEFAULT '10',
	`peso_objetivo` text DEFAULT '0',
	FOREIGN KEY (`rutina_dia_ejercicio_id`) REFERENCES `rutina_dia_ejercicios`(`id`) ON UPDATE no action ON DELETE cascade
);
