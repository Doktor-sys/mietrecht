
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPrisma() {
    try {
        console.log('Checking prisma.reportGeneration...');
        if ((prisma as any).reportGeneration) {
            console.log('prisma.reportGeneration exists!');
        } else {
            console.error('prisma.reportGeneration DOES NOT exist!');
            console.log('Available properties on prisma:', Object.keys(prisma));
        }
    } catch (error) {
        console.error('Error checking prisma:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkPrisma();
