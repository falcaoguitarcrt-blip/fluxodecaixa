CREATE TABLE `finance_audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`profileId` int,
	`action` varchar(40) NOT NULL,
	`entityType` varchar(40) NOT NULL,
	`entityId` int,
	`summary` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `finance_audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `finance_backups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`label` varchar(120) NOT NULL,
	`payload` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `finance_backups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `finance_audit_owner_date_idx` ON `finance_audit_logs` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `finance_backups_owner_date_idx` ON `finance_backups` (`userId`,`createdAt`);