-- Migração para remover constraint obrigatória de contactId em emails_sent
-- Permite deletar contatos sem afetar registros de emails enviados

-- 1. Remove a foreign key constraint existente
ALTER TABLE `emails_sent` DROP FOREIGN KEY `emails_sent_contactId_fkey`;

-- 2. Modifica a coluna contactId para permitir NULL
ALTER TABLE `emails_sent` MODIFY `contactId` VARCHAR(191) NULL;

-- 3. Adiciona nova foreign key com ON DELETE SET NULL
ALTER TABLE `emails_sent` 
ADD CONSTRAINT `emails_sent_contactId_fkey` 
FOREIGN KEY (`contactId`) REFERENCES `contacts`(`id`) 
ON DELETE SET NULL ON UPDATE CASCADE;

-- 4. Adiciona índice para performance (se não existir)
CREATE INDEX IF NOT EXISTS `emails_sent_contactId_idx` ON `emails_sent`(`contactId`); 