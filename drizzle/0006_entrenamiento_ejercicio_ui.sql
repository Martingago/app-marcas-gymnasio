CREATE TABLE `entrenamiento_ejercicio_ui` (
	`entrenamiento_id` integer NOT NULL,
	`ejercicio_id` integer NOT NULL,
	`minimizado` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`entrenamiento_id`, `ejercicio_id`),
	FOREIGN KEY (`entrenamiento_id`) REFERENCES `entrenamientos`(`id`) ON UPDATE no action ON DELETE cascade
);
