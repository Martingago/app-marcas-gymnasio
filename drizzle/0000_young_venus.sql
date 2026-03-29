CREATE TABLE `categorias` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categorias_nombre_unique` ON `categorias` (`nombre`);--> statement-breakpoint
CREATE TABLE `ejercicios` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`categoria_id` integer,
	FOREIGN KEY (`categoria_id`) REFERENCES `categorias`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `rutinas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rutina_dias` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`rutina_id` integer,
	`nombre` text NOT NULL,
	`orden` integer NOT NULL,
	FOREIGN KEY (`rutina_id`) REFERENCES `rutinas`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `rutina_dia_ejercicios` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`rutina_dia_id` integer,
	`ejercicio_id` integer,
	`series_objetivo` integer DEFAULT 3,
	`reps_objetivo` text DEFAULT '10',
	`orden` integer NOT NULL,
	FOREIGN KEY (`rutina_dia_id`) REFERENCES `rutina_dias`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`ejercicio_id`) REFERENCES `ejercicios`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `entrenamientos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`fecha` text NOT NULL,
	`rutina_dia_id` integer,
	`nombre_snapshot` text,
	FOREIGN KEY (`rutina_dia_id`) REFERENCES `rutina_dias`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `series` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entrenamiento_id` integer,
	`ejercicio_id` integer,
	`peso` real NOT NULL,
	`repeticiones` integer NOT NULL,
	`es_dropset` integer DEFAULT 0,
	FOREIGN KEY (`entrenamiento_id`) REFERENCES `entrenamientos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`ejercicio_id`) REFERENCES `ejercicios`(`id`) ON UPDATE no action ON DELETE cascade
);
