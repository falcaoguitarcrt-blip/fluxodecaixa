CREATE TABLE `budgets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`profileId` int NOT NULL,
	`month` varchar(7) NOT NULL,
	`category` varchar(80) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `budgets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recurring_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`profileId` int NOT NULL,
	`description` varchar(180) NOT NULL,
	`category` varchar(80) NOT NULL,
	`bank` varchar(80) NOT NULL,
	`direction` enum('in','out') NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`dayOfMonth` int NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp,
	`active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `recurring_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reminders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`profileId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`dueDate` timestamp NOT NULL,
	`kind` varchar(40) NOT NULL,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reminders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `budgets_owner_month_idx` ON `budgets` (`userId`,`profileId`,`month`);--> statement-breakpoint
CREATE INDEX `recurring_rules_owner_idx` ON `recurring_rules` (`userId`,`profileId`);--> statement-breakpoint
CREATE INDEX `reminders_owner_due_idx` ON `reminders` (`userId`,`profileId`,`dueDate`);