CREATE TABLE `recurring_occurrences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`profileId` int NOT NULL,
	`ruleId` int NOT NULL,
	`transactionId` int,
	`month` varchar(7) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `recurring_occurrences_id` PRIMARY KEY(`id`),
	CONSTRAINT `recurring_occurrences_rule_month_uq` UNIQUE(`ruleId`,`month`)
);
--> statement-breakpoint
CREATE INDEX `recurring_occurrences_owner_month_idx` ON `recurring_occurrences` (`userId`,`profileId`,`month`);