CREATE TABLE `bills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`profileId` int NOT NULL,
	`description` varchar(180) NOT NULL,
	`dueDate` timestamp NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`responsible` varchar(80) NOT NULL,
	`status` enum('pending','paid','late') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bills_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `credit_cards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`profileId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`brand` varchar(40) NOT NULL,
	`dueDay` int NOT NULL,
	`closingDay` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `credit_cards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `finance_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`profileKey` enum('felipe','sara') NOT NULL,
	`displayName` varchar(80) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `finance_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `investments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`profileId` int NOT NULL,
	`description` varchar(180) NOT NULL,
	`category` varchar(80) NOT NULL,
	`institution` varchar(80) NOT NULL,
	`investedAmount` decimal(12,2) NOT NULL,
	`marketValue` decimal(12,2) NOT NULL,
	`investedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `investments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`profileId` int NOT NULL,
	`date` timestamp NOT NULL,
	`description` varchar(180) NOT NULL,
	`category` varchar(80) NOT NULL,
	`bank` varchar(80) NOT NULL,
	`direction` enum('in','out') NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trash_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`entityType` enum('transaction','bill','investment','card') NOT NULL,
	`entityId` int NOT NULL,
	`label` varchar(180) NOT NULL,
	`payload` text NOT NULL,
	`deletedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trash_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE INDEX `bills_owner_due_idx` ON `bills` (`userId`,`dueDate`);--> statement-breakpoint
CREATE INDEX `credit_cards_owner_idx` ON `credit_cards` (`userId`);--> statement-breakpoint
CREATE INDEX `finance_profiles_user_idx` ON `finance_profiles` (`userId`);--> statement-breakpoint
CREATE INDEX `investments_owner_date_idx` ON `investments` (`userId`,`investedAt`);--> statement-breakpoint
CREATE INDEX `transactions_owner_date_idx` ON `transactions` (`userId`,`date`);--> statement-breakpoint
CREATE INDEX `transactions_profile_idx` ON `transactions` (`profileId`);--> statement-breakpoint
CREATE INDEX `trash_owner_idx` ON `trash_items` (`userId`,`deletedAt`);