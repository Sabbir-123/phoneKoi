import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });


async function runMigration() {
  console.log('--- Starting Idempotent Data Migration to Supabase PostgreSQL ---');
  const backupDir = path.join(__dirname, '..', 'data', 'backup_pre_migration');

  // 1. Migrate Users
  const usersPath = path.join(backupDir, 'user-profiles.json');
  if (fs.existsSync(usersPath)) {
    const profiles = JSON.parse(fs.readFileSync(usersPath, 'utf-8')) || [];
    console.log(`Migrating ${profiles.length} user profiles...`);
    for (const p of profiles) {
      if (!p.email) continue;
      const email = p.email.toLowerCase().trim();
      
      // Determine avatarUrl (keep existing URL or reference)
      let avatarUrl = p.avatar;
      if (avatarUrl && avatarUrl.startsWith('data:image/')) {
        // Mark as storage reference
        avatarUrl = `avatars/${Buffer.from(email).toString('hex').slice(0, 16)}.png`;
      }

      await prisma.user.upsert({
        where: { email },
        update: {
          displayName: p.displayName || email.split('@')[0],
          phone: p.phone || null,
          normalizedPhone: p.normalizedPhone || p.phone || null,
          whatsapp: p.whatsapp || null,
          address: p.address || null,
          avatarUrl: avatarUrl || null,
          isProfileComplete: Boolean(p.isProfileComplete && p.phone && p.address),
        },
        create: {
          email,
          role: email === 'ahmedsabbir2013@gmail.com' ? 'ADMIN' : 'USER',
          displayName: p.displayName || email.split('@')[0],
          phone: p.phone || null,
          normalizedPhone: p.normalizedPhone || p.phone || null,
          whatsapp: p.whatsapp || null,
          address: p.address || null,
          avatarUrl: avatarUrl || null,
          isProfileComplete: Boolean(p.isProfileComplete && p.phone && p.address),
          plan: email === 'ahmedsabbir2013@gmail.com' ? 'PRO' : '6 Months Pro',
          isPro: true,
          searchLimit: email === 'ahmedsabbir2013@gmail.com' ? 99999 : 30,
          searchesLeft: email === 'ahmedsabbir2013@gmail.com' ? 99999 : 30,
          reportLimit: email === 'ahmedsabbir2013@gmail.com' ? 9999 : 10,
          reportsLeft: email === 'ahmedsabbir2013@gmail.com' ? 9999 : 10,
        },
      });
      console.log(`  ✓ Upserted User: ${email}`);
    }
  }

  // 2. Migrate Devices
  const devicesPath = path.join(backupDir, 'devices.json');
  if (fs.existsSync(devicesPath)) {
    const devices = JSON.parse(fs.readFileSync(devicesPath, 'utf-8')) || [];
    console.log(`Migrating ${devices.length} devices...`);
    for (const d of devices) {
      if (!d.imei) continue;
      await prisma.device.upsert({
        where: { imei: d.imei },
        update: {
          status: d.status || 'CLEAN',
          riskScore: d.riskScore ?? 0,
          riskLevel: d.riskLevel || 'LOW',
        },
        create: {
          imei: d.imei,
          status: d.status || 'CLEAN',
          riskScore: d.riskScore ?? 0,
          riskLevel: d.riskLevel || 'LOW',
        },
      });
      console.log(`  ✓ Upserted Device: ${d.imei}`);
    }
  }

  // 3. Migrate Reports
  const reportsPath = path.join(backupDir, 'reports.json');
  if (fs.existsSync(reportsPath)) {
    const reports = JSON.parse(fs.readFileSync(reportsPath, 'utf-8')) || [];
    console.log(`Migrating ${reports.length} reports...`);
    for (const r of reports) {
      if (!r.imei) continue;
      // Ensure Device exists
      await prisma.device.upsert({
        where: { imei: r.imei },
        update: {},
        create: { imei: r.imei, status: r.status === 'APPROVED' ? 'STOLEN' : 'CLEAN' },
      });

      // Find user if available
      let user = null;
      if (r.userEmail) {
        user = await prisma.user.findUnique({ where: { email: r.userEmail.toLowerCase().trim() } });
      }

      let gdStoragePath = r.gdStoragePath || null;
      if (r.gdImage && r.gdImage.startsWith('data:image/')) {
        gdStoragePath = `gd-documents/${r.id}.jpg`;
      }

      await prisma.report.upsert({
        where: { id: r.id },
        update: {
          imei: r.imei,
          reporterIp: r.reporterIp || null,
          userId: user?.id || null,
          userEmail: r.userEmail || null,
          location: r.location || null,
          description: r.description || null,
          contactNumber: r.contactNumber || null,
          deviceName: r.deviceName || null,
          brand: r.brand || null,
          model: r.model || null,
          reportType: r.reportType || 'STOLEN',
          policeGdNumber: r.policeGdNumber || null,
          policeStation: r.policeStation || null,
          extractedFromGd: Boolean(r.extractedFromGd),
          aiExtractionConfidence: r.aiExtractionConfidence ?? null,
          status: r.status || 'PENDING',
          trustWeight: r.trustWeight ?? 1,
          gdStoragePath,
        },
        create: {
          id: r.id,
          imei: r.imei,
          reporterIp: r.reporterIp || null,
          userId: user?.id || null,
          userEmail: r.userEmail || null,
          location: r.location || null,
          description: r.description || null,
          contactNumber: r.contactNumber || null,
          deviceName: r.deviceName || null,
          brand: r.brand || null,
          model: r.model || null,
          reportType: r.reportType || 'STOLEN',
          policeGdNumber: r.policeGdNumber || null,
          policeStation: r.policeStation || null,
          extractedFromGd: Boolean(r.extractedFromGd),
          aiExtractionConfidence: r.aiExtractionConfidence ?? null,
          status: r.status || 'PENDING',
          trustWeight: r.trustWeight ?? 1,
          gdStoragePath,
        },
      });
      console.log(`  ✓ Upserted Report: ${r.id} for IMEI ${r.imei}`);
    }
  }

  // 4. Migrate Search Events
  const searchEventsPath = path.join(backupDir, 'search-events.json');
  if (fs.existsSync(searchEventsPath)) {
    const events = JSON.parse(fs.readFileSync(searchEventsPath, 'utf-8')) || [];
    console.log(`Migrating ${events.length} search events...`);
    for (const ev of events) {
      if (!ev.id || !ev.imei) continue;
      // Ensure Device exists
      await prisma.device.upsert({
        where: { imei: ev.imei },
        update: {},
        create: { imei: ev.imei, status: 'STOLEN' },
      });

      let owner = null;
      if (ev.ownerEmail) {
        owner = await prisma.user.findUnique({ where: { email: ev.ownerEmail.toLowerCase().trim() } });
      }

      await prisma.searchEvent.upsert({
        where: { id: ev.id },
        update: {
          isRead: Boolean(ev.isRead),
          notifications: ev.notifications || [],
        },
        create: {
          id: ev.id,
          imei: ev.imei,
          ownerId: owner?.id || null,
          ownerEmail: ev.ownerEmail || '',
          maskedImei: ev.maskedImei || ev.imei,
          deviceBrand: ev.deviceBrand || ev.brand || null,
          deviceModel: ev.deviceModel || ev.model || null,
          deviceName: ev.deviceName || null,
          searchResult: ev.searchResult || 'STOLEN',
          ip: ev.ip || null,
          latitude: ev.latitude ?? null,
          longitude: ev.longitude ?? null,
          accuracyRadius: ev.accuracyRadius ?? null,
          locationSource: ev.locationSource || 'IP_APPROXIMATE',
          locationName: ev.locationName || null,
          policeGdNumber: ev.policeGdNumber || null,
          isRead: Boolean(ev.isRead),
          notifications: ev.notifications || [],
          timestamp: ev.timestamp ? new Date(ev.timestamp) : new Date(),
        },
      });
      console.log(`  ✓ Upserted SearchEvent: ${ev.id}`);
    }
  }

  console.log('--- Migration completed successfully! ---');
  await prisma.$disconnect();
}

runMigration().catch(async (e) => {
  console.error('Migration failed:', e);
  await prisma.$disconnect();
  process.exit(1);
});
