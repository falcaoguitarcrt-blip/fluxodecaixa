CREATE TABLE `finance_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`profileId` int NOT NULL,
	`name` varchar(80) NOT NULL,
	`direction` enum('in','out') NOT NULL,
	`status` enum('active','archived') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `finance_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `finance_categories_owner_profile_idx` ON `finance_categories` (`userId`,`profileId`,`direction`,`status`);