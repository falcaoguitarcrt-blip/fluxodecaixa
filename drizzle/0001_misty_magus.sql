CREATE TABLE `card_purchases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`profileId` int NOT NULL,
	`cardId` int NOT NULL,
	`description` varchar(180) NOT NULL,
	`category` varchar(80) NOT NULL,
	`purchaseDate` timestamp NOT NULL,
	`totalAmount` decimal(12,2) NOT NULL,
	`installmentAmount` decimal(12,2) NOT NULL,
	`installments` int NOT NULL DEFAULT 1,
	`currentInstallment` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `card_purchases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `card_purchases_owner_date_idx` ON `card_purchases` (`userId`,`purchaseDate`);